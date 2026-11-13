"""Trusted host operator CLI: copy, independently verify, then atomic DB cutover.

PostgreSQL and object storage are deliberately separate transactions. Durable
song_imports journals retain prior bindings, rights evidence and retry state.
"""

import argparse
import hashlib
import json
from dataclasses import asdict
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select, text

from app.core.database import Database
from app.modules.catalog.asset_models import SongAssetRecord
from app.modules.catalog.local_catalog import scan, sync_local_catalog
from app.modules.catalog.local_storage import LocalSongStorage
from app.modules.catalog.object_storage import ObjectSongStorage, object_storage
from app.modules.catalog.songs import SongAuditRecord, SongImportRecord


def snapshot(binding: SongAssetRecord) -> dict[str, Any]:
    return {
        name: getattr(binding, name)
        for name in ("source_kind", "source_key", "revision", "files", "rights_status")
    }


def fingerprint(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def plan(root: Path, rights: dict[str, Any]) -> dict[str, Any]:
    report = scan(root)
    entries = report["entries"]
    assert isinstance(entries, list)
    total = 0
    for entry in entries:
        assert isinstance(entry, dict)
        files = entry["files"]
        grant = rights.get(entry["folder"], {})
        # Evidence is bound to the exact bytes, never inferred from possession.
        approved = bool(
            grant.get("evidence")
            and grant.get("source")
            and grant.get("sha256")
            == {name: item["sha256"] for name, item in files.items()}
        )
        entry["publication"] = "eligible" if approved else "blocked_rights"
        total += sum(item["size"] for item in files.values())
    return dict(report, bytes=total)


def sync(
    db: Database,
    root: Path,
    objects: ObjectSongStorage,
    rights: dict[str, Any],
    max_bytes: int = 256 * 1024 * 1024,
    max_songs: int = 100,
) -> dict[str, Any]:
    report = plan(root, rights)
    entries = report["entries"]
    if report["bytes"] > max_bytes or len(entries) > max_songs:
        raise ValueError("Import exceeds configured operator batch limit")
    # Creates stable local identities for new folders; preserves remote bindings.
    sync_local_catalog(db, root)
    local = LocalSongStorage(root)
    results = []
    for entry in entries:
        folder = entry["folder"]
        if entry["publication"] != "eligible":
            results.append({"folder": folder, "state": "blocked_rights"})
            continue
        digest = fingerprint([entry["files"], rights[folder]])
        with db.transaction() as session:
            session.execute(text("SELECT pg_advisory_xact_lock(73501624)"))
            binding = session.scalar(
                select(SongAssetRecord).where(SongAssetRecord.source_key == folder)
            )
            if binding is None:
                results.append({"folder": folder, "state": "conflicting"})
                continue
            song_id = binding.song_id
            key = f"media:{song_id.hex}:{digest[:56]}"
            job = session.scalar(
                select(SongImportRecord).where(SongImportRecord.key == key)
            )
            if job is not None and job.state == "active":
                state = (
                    "unchanged"
                    if snapshot(binding) == job.payload.get("after")
                    else "conflicting"
                )
                results.append({"folder": folder, "state": state})
                continue
            if job is None:
                job = SongImportRecord(
                    id=uuid4(),
                    key=key,
                    fingerprint=digest,
                    state="staged",
                    payload={
                        "song_id": str(song_id),
                        "before": snapshot(binding),
                        "source": entry["files"],
                        "rights": rights[folder],
                    },
                    versions={str(song_id): binding.revision},
                    issues=[],
                    actor_id=None,
                )
                session.add(job)
                session.flush()
            job_id = job.id
        try:
            uploaded = {}
            for name, data in entry["files"].items():
                asset = local.describe(data["key"])
                if asset is None or asdict(asset) != data:
                    raise ValueError("Source changed after scan; rerun dry-run")
                object_key = f"songs/{song_id}/{digest}/{name}"
                uploaded[name] = asdict(objects.copy_verified(local, asset, object_key))
            with db.transaction() as session:
                session.execute(text("SELECT pg_advisory_xact_lock(73501624)"))
                binding = session.get(SongAssetRecord, song_id)
                job = session.get(SongImportRecord, job_id)
                assert binding is not None and job is not None
                if snapshot(binding) != job.payload["before"]:
                    raise ValueError("Active mapping changed; cutover refused")
                binding.source_kind = "object"
                binding.files = uploaded
                binding.rights_status = "verified"
                binding.revision += 1
                job.payload = dict(job.payload, after=snapshot(binding))
                job.state = "active"
                job.issues = []
                session.add(
                    SongAuditRecord(
                        id=uuid4(),
                        song_id=song_id,
                        import_id=job_id,
                        action="cloud-assets-cutover",
                    )
                )
            results.append({"folder": folder, "state": "active", "job": str(job_id)})
        except OSError, ValueError:
            with db.transaction() as session:
                job = session.get(SongImportRecord, job_id)
                assert job is not None
                job.state = "failed"
                job.issues = ["Copy/verification/cutover failed; old mapping retained"]
            results.append({"folder": folder, "state": "failed", "job": str(job_id)})
    return dict(report, results=results)


def rollback(db: Database, identifier: UUID) -> None:
    with db.transaction() as session:
        session.execute(text("SELECT pg_advisory_xact_lock(73501624)"))
        job = session.get(SongImportRecord, identifier)
        if job is None or job.state != "active":
            raise ValueError("An active media job is required")
        binding = session.get(SongAssetRecord, UUID(str(job.payload["song_id"])))
        if binding is None or snapshot(binding) != job.payload["after"]:
            raise ValueError("Mapping changed since cutover; rollback refused")
        before = job.payload["before"]
        assert isinstance(before, dict)
        for name, value in before.items():
            setattr(binding, name, value)
        job.state = "rolled_back"
        session.add(
            SongAuditRecord(
                id=uuid4(),
                song_id=binding.song_id,
                import_id=job.id,
                action="cloud-assets-rollback",
            )
        )


def cleanup(db: Database, objects: ObjectSongStorage, identifier: UUID) -> int:
    """Explicit failed-job cleanup; never remove active or rollback objects."""
    with db.transaction() as session:
        session.execute(text("SELECT pg_advisory_xact_lock(73501624)"))
        job = session.get(SongImportRecord, identifier)
        if job is None or job.state not in ("staged", "failed"):
            raise ValueError("Cleanup requires a failed or staged media job")
        source = job.payload["source"]
        assert isinstance(source, dict)
        keys = {
            f"songs/{job.payload['song_id']}/{job.fingerprint}/{name}"
            for name in source
        }
        retained = {
            str(asset["key"])
            for binding in session.scalars(select(SongAssetRecord))
            for asset in binding.files.values()
        }
        for other in session.scalars(select(SongImportRecord)):
            for label in ("before", "after"):
                mapping = other.payload.get(label)
                if isinstance(mapping, dict):
                    retained.update(
                        str(a["key"]) for a in mapping.get("files", {}).values()
                    )
        if keys & retained:
            raise ValueError("Cleanup would remove an active or rollback asset")
        for key in keys:
            objects.client.delete_object(Bucket=objects.bucket, Key=key)
        job.state = "cleaned"
        return len(keys)


def main() -> None:
    parser = argparse.ArgumentParser(description="Trusted host operator only")
    parser.add_argument(
        "command",
        choices=["scan", "dry-run", "sync", "resume", "status", "rollback", "cleanup"],
    )
    parser.add_argument("--root", type=Path)
    parser.add_argument("--rights", type=Path)
    parser.add_argument("--job", type=UUID)
    parser.add_argument("--max-bytes", type=int, default=256 * 1024 * 1024)
    parser.add_argument("--max-songs", type=int, default=100)
    args = parser.parse_args()
    rights = json.loads(args.rights.read_text(encoding="utf-8")) if args.rights else {}
    if args.command in ("scan", "dry-run", "sync", "resume") and args.root is None:
        parser.error("--root is required")
    if args.command in ("scan", "dry-run"):
        print(json.dumps(plan(args.root, rights), indent=2))
        return
    import app.core.models  # noqa: F401
    from app.core.config import Settings

    settings = Settings()
    if settings.database_url is None:
        parser.error("CHORD_DATABASE_URL is required")
    db = Database(settings.database_url.get_secret_value())
    try:
        if args.command == "status":
            with db.transaction() as session:
                print(
                    json.dumps(
                        [
                            {"job": str(j.id), "state": j.state, "issues": j.issues}
                            for j in session.scalars(
                                select(SongImportRecord).where(
                                    SongImportRecord.key.startswith("media:")
                                )
                            )
                        ],
                        indent=2,
                    )
                )
        elif args.command == "rollback":
            if args.job is None:
                parser.error("--job is required")
            rollback(db, args.job)
            print('{"state":"rolled_back"}')
        elif args.command == "cleanup":
            if args.job is None or not settings.object_bucket:
                parser.error("--job and CHORD_OBJECT_BUCKET are required")
            removed = cleanup(db, object_storage(settings.object_bucket), args.job)
            print(json.dumps({"removed": removed}))
        else:
            if not settings.object_bucket:
                parser.error(
                    "CHORD_OBJECT_BUCKET and server-side AWS credentials are required"
                )
            print(
                json.dumps(
                    sync(
                        db,
                        args.root,
                        object_storage(settings.object_bucket),
                        rights,
                        args.max_bytes,
                        args.max_songs,
                    ),
                    indent=2,
                )
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()
