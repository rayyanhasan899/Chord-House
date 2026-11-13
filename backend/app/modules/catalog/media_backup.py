"""Matched PostgreSQL snapshot and immutable media backup; operator-only CLI."""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
from dataclasses import asdict
from pathlib import Path

from sqlalchemy import select, text
from sqlalchemy.engine import make_url

from app.core.database import Database
from app.modules.catalog.asset_models import SongAssetRecord
from app.modules.catalog.local_storage import LocalSongStorage
from app.modules.catalog.media_storage import MediaStorage, configured_storage
from app.modules.catalog.song_storage import Asset


def checksum(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def postgres_env(url: str) -> dict[str, str]:
    parsed = make_url(url)
    env = dict(os.environ)
    for key, value in {
        "PGHOST": parsed.host,
        "PGPORT": str(parsed.port or 5432),
        "PGDATABASE": parsed.database,
        "PGUSER": parsed.username,
        "PGPASSWORD": parsed.password,
    }.items():
        if value is not None:
            env[key] = value
    for key in ("sslmode", "sslrootcert", "sslcert", "sslkey", "channel_binding"):
        option = parsed.query.get(key)
        if isinstance(option, str):
            env["PG" + key.upper()] = option
    return env


def backup(db: Database, url: str, storage: MediaStorage, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=False)
    records = []
    env = postgres_env(url)
    # pg_dump and mapping SELECT share an exported repeatable-read snapshot.
    with db.transaction() as session:
        session.execute(text("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ"))
        snapshot_id = session.scalar(text("SELECT pg_export_snapshot()"))
        subprocess.run(
            [
                "pg_dump",
                "--format=custom",
                "--no-owner",
                "--no-acl",
                f"--snapshot={snapshot_id}",
                "--file",
                str(destination / "database.dump"),
            ],
            env=env,
            check=True,
            capture_output=True,
        )
        for binding in session.scalars(select(SongAssetRecord)):
            files = []
            for expected in binding.files.values():
                key = str(expected["key"])
                asset = storage.describe(key)
                if asset is None or asset.sha256 != expected["sha256"]:
                    raise ValueError("Backup source unavailable or changed")
                relative = f"objects/{binding.song_id}/{asset.sha256}/{Path(key).name}"
                target = destination / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open("wb") as stream:
                    for chunk in storage.read(key):
                        stream.write(chunk)
                if (
                    checksum(target) != asset.sha256
                    or target.stat().st_size != asset.size
                ):
                    raise ValueError("Backup object verification failed")
                files.append(dict(asdict(asset), backup_path=relative))
            records.append(
                {
                    "song_id": str(binding.song_id),
                    "revision": binding.revision,
                    "kind": binding.source_kind,
                    "files": files,
                }
            )
    manifest = {
        "version": 1,
        "dump_sha256": checksum(destination / "database.dump"),
        "bindings": records,
    }
    # Written last; absence means incomplete backup, never a restorable snapshot.
    (destination / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )


def verify(root: Path) -> dict[str, object]:
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    if (
        manifest["version"] != 1
        or checksum(root / "database.dump") != manifest["dump_sha256"]
    ):
        raise ValueError("Invalid database snapshot")
    for binding in manifest["bindings"]:
        for asset in binding["files"]:
            target = (root / asset["backup_path"]).resolve()
            if not target.is_relative_to(root.resolve()) or target.is_symlink():
                raise ValueError("Unsafe backup path")
            if (
                checksum(target) != asset["sha256"]
                or target.stat().st_size != asset["size"]
            ):
                raise ValueError("Invalid backup object")
    return {"version": 1, "bindings": len(manifest["bindings"]), "state": "verified"}


def restore(db: Database, url: str, storage: MediaStorage, root: Path) -> None:
    verify(root)
    with db.transaction() as session:
        if session.scalar(
            text(
                "SELECT count(*) FROM information_schema.tables "
                "WHERE table_schema='public'"
            )
        ):
            raise ValueError("Restore requires a fresh empty isolated database")
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    source = LocalSongStorage(root)
    for binding in manifest["bindings"]:
        for data in binding["files"]:
            asset = Asset(
                data["backup_path"], data["size"], data["sha256"], data["media_type"]
            )
            key = data["key"]
            if binding["kind"] == "object":
                if storage.objects is None:
                    raise ValueError("Private restore bucket required")
                storage.objects.copy_verified(source, asset, key)
            else:
                relative = Path(key)
                if relative.is_absolute() or ".." in relative.parts:
                    raise ValueError("Unsafe local restore key")
                target = storage.local.root / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                if target.exists():
                    if checksum(target) != asset.sha256:
                        raise ValueError("Local restore destination conflict")
                else:
                    with (root / asset.key).open("rb") as src, target.open("xb") as dst:
                        shutil.copyfileobj(src, dst, 64 * 1024)
                if checksum(target) != asset.sha256:
                    raise ValueError("Local restore verification failed")
    env = postgres_env(url)
    subprocess.run(
        [
            "pg_restore",
            "--dbname",
            env["PGDATABASE"],
            "--no-owner",
            "--no-acl",
            "--single-transaction",
            "--exit-on-error",
            str(root / "database.dump"),
        ],
        env=env,
        check=True,
        capture_output=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Trusted host operator; private backup"
    )
    parser.add_argument("command", choices=["create", "verify", "restore"])
    parser.add_argument("--directory", type=Path, required=True)
    args = parser.parse_args()
    if args.command == "verify":
        print(json.dumps(verify(args.directory)))
        return
    import app.core.models  # noqa: F401
    from app.core.config import Settings

    settings = Settings()
    secret = settings.database_url_unpooled or settings.database_url
    if secret is None:
        parser.error("Direct PostgreSQL connection required")
    db = Database(secret.get_secret_value())
    try:
        operation = restore if args.command == "restore" else backup
        operation(
            db,
            secret.get_secret_value(),
            configured_storage(Path(settings.songs_directory), settings.object_bucket),
            args.directory,
        )
        print(json.dumps(verify(args.directory)))
    finally:
        db.close()


if __name__ == "__main__":
    main()
