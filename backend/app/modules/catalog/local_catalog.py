"""Trusted host operator inventory/sync. Read requests never import content."""

import argparse
import json
from dataclasses import asdict
from pathlib import Path
from typing import Literal, cast
from uuid import NAMESPACE_URL, UUID, uuid4, uuid5

from sqlalchemy import select, text

from app.core.database import Database
from app.modules.catalog.asset_models import SongAssetRecord
from app.modules.catalog.local_songs import LANGUAGES
from app.modules.catalog.local_storage import LocalSongStorage
from app.modules.catalog.song_domain import normalize
from app.modules.catalog.song_schemas import Grant, SongInput
from app.modules.catalog.songs import SongAuditRecord, SongRecord, identity
from app.modules.personal_workspace.workspace import SongReference


def scan(root: Path) -> dict[str, object]:
    storage = LocalSongStorage(root)
    entries: list[dict[str, object]] = []
    issues: list[str] = []
    if not root.is_dir():
        return {
            "entries": entries,
            "issues": ["Song root unavailable; nothing changed"],
        }
    for language, dirname in LANGUAGES.items():
        parent = root / dirname
        if parent.is_symlink():
            issues.append(f"{dirname}: symlink is not allowed")
            continue
        if not parent.is_dir():
            continue
        folders = sorted(parent.iterdir(), key=lambda p: p.name)
        for folder in folders:
            if not folder.is_dir():
                continue
            key = folder.relative_to(root).as_posix()
            if folder.is_symlink():
                issues.append(f"{key}: symlink is not allowed")
                continue
            if sum(normalize(p.name) == normalize(folder.name) for p in folders) != 1:
                issues.append(f"{key}: normalized title collision; correction required")
                continue
            files: dict[str, dict[str, str | int]] = {}
            invalid = False
            for path in folder.iterdir():
                if path.name not in ("audio.mp3", "lyrics.txt"):
                    issues.append(f"{key}/{path.name}: unsupported file (not imported)")
                    continue
                asset = storage.describe(key + "/" + path.name)
                if asset is None:
                    issues.append(
                        f"{key}/{path.name}: invalid, empty, oversized or unsafe asset"
                    )
                    invalid = True
                else:
                    files[path.name] = asdict(asset)
            if files and not invalid:
                entries.append(
                    {
                        "language": language,
                        "title": folder.name,
                        "folder": key,
                        "files": files,
                    }
                )
            elif not files and not invalid:
                issues.append(f"{key}: no usable audio.mp3 or lyrics.txt")
    return {"entries": entries, "issues": issues}


def sync_local_catalog(
    db: Database, root: Path, rename: tuple[UUID, str] | None = None
) -> dict[str, object]:
    report = scan(root)
    entries = cast(list[dict[str, object]], report["entries"])
    issues = cast(list[str], report["issues"])
    counts = {"added": 0, "updated": 0, "unchanged": 0}
    with db.transaction() as session:
        session.execute(text("SELECT pg_advisory_xact_lock(73501624)"))
        rows = list(session.scalars(select(SongRecord)))
        bindings = {b.source_key: b for b in session.scalars(select(SongAssetRecord))}
        if rename is not None:
            identifier, destination = rename
            binding = session.get(SongAssetRecord, identifier)
            entry = next((e for e in entries if e["folder"] == destination), None)
            if binding is None or entry is None or destination in bindings:
                raise ValueError(
                    "Rename needs an existing binding and valid unbound destination"
                )
            row = session.get(SongRecord, identifier)
            assert row is not None
            data = SongInput.model_validate(row.document).model_copy(
                update={"title": str(entry["title"]), "language": entry["language"]}
            )
            if any(
                r.id != identifier and r.identity_key == identity(data) for r in rows
            ):
                raise ValueError("Rename conflicts with an existing catalogue identity")
            del bindings[binding.source_key]
            binding.source_key = destination
            bindings[destination] = binding
            row.document = data.model_dump(mode="json")
            row.identity_key = identity(data)
            row.search_text = normalize(
                data.title + " " + data.artist + " " + " ".join(data.aliases)
            )
            row.language = data.language
            row.revision += 1
            ref = session.get(SongReference, identifier)
            assert ref is not None
            ref.title, ref.language = data.title, data.language
            session.add(
                SongAuditRecord(
                    id=uuid4(), song_id=identifier, action="local-folder-rename"
                )
            )
        for entry in entries:
            key = str(entry["folder"])
            binding = bindings.get(key)
            candidates = [
                r
                for r in rows
                if r.language == entry["language"]
                and normalize(str(r.document["title"]))
                == normalize(str(entry["title"]))
            ]
            if binding is not None:
                row = session.get(SongRecord, binding.song_id)
            elif len(candidates) > 1:
                issues.append(
                    f"{key}: ambiguous catalogue title; explicit mapping required"
                )
                continue
            else:
                row = candidates[0] if candidates else None
            if row is None:
                signatures = {
                    name: value["sha256"]
                    for name, value in cast(
                        dict[str, dict[str, str | int]], entry["files"]
                    ).items()
                }
                present = {str(e["folder"]) for e in entries}
                if any(
                    b.source_key not in present
                    and {name: value["sha256"] for name, value in b.files.items()}
                    == signatures
                    for b in bindings.values()
                ):
                    issues.append(
                        f"{key}: possible rename; use explicit rename mapping"
                    )
                    continue
                identifier = uuid5(
                    NAMESPACE_URL,
                    "chord-house:local:"
                    + str(entry["language"])
                    + ":"
                    + normalize(str(entry["title"])),
                )
                # Metadata inventory is not an audio/lyrics publication grant.
                grant = Grant(
                    origin="user_submission",
                    license="Operator catalogue metadata",
                    source_url=f"https://localhost/songs/{identifier}",
                    attribution="Local folder inventory",
                    evidence=(
                        "Title/language recorded from folder names; "
                        "media distribution permission is unverified."
                    ),
                    terms_version="local-inventory-v2",
                    reviewer="Trusted local operator",
                    reviewed=True,
                    display=True,
                    cache=True,
                    territories=["*"],
                )
                item = SongInput(
                    external_key="local:" + str(identifier),
                    title=str(entry["title"]),
                    artist="Artist not specified",
                    language=cast(Literal["en", "ur", "hi"], entry["language"]),
                    metadata_grant=grant,
                )
                session.add(
                    SongReference(
                        id=identifier,
                        title=item.title,
                        artist=item.artist,
                        language=item.language,
                        reviewed=True,
                    )
                )
                session.flush()
                row = SongRecord(
                    id=identifier,
                    external_key=item.external_key,
                    identity_key=identity(item),
                    search_text=normalize(item.title),
                    language=item.language,
                    status="published",
                    withdrawn=[],
                    revision=1,
                    document=item.model_dump(mode="json"),
                )
                session.add(row)
                session.flush()
                rows.append(row)
            if row.external_key.startswith("local:"):
                data = SongInput.model_validate(row.document)
                if (
                    data.metadata_grant.evidence
                    == "Project owner confirmed publication permission."
                ):
                    data.metadata_grant.evidence = (
                        "Folder metadata inventory only; "
                        "media distribution permission is unverified."
                    )
                    data.metadata_grant.license = "Operator catalogue metadata"
                    data.metadata_grant.terms_version = "local-inventory-v2"
                    row.document = data.model_dump(mode="json")
            files = cast(dict[str, dict[str, str | int]], entry["files"])
            if binding is None:
                if session.get(SongAssetRecord, row.id) is not None:
                    issues.append(
                        f"{key}: song already bound; use explicit rename mapping"
                    )
                    continue
                binding = SongAssetRecord(
                    song_id=row.id,
                    source_kind="local",
                    source_key=key,
                    files=files,
                    rights_status="unverified",
                    revision=1,
                )
                session.add(binding)
                bindings[key] = binding
                counts["added"] += 1
                action = "local-assets-import"
            elif binding.files != files:
                binding.files = files
                binding.revision += 1
                counts["updated"] += 1
                action = "local-assets-replace"
            else:
                counts["unchanged"] += 1
                continue
            session.add(SongAuditRecord(id=uuid4(), song_id=row.id, action=action))
    return report | counts


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Trusted host operator only; no web upload or cloud migration"
    )
    parser.add_argument("command", choices=["scan", "sync", "rename"])
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--song-id", type=UUID)
    parser.add_argument("--to")
    args = parser.parse_args()
    if args.command == "scan":
        print(json.dumps(scan(args.root), ensure_ascii=True, indent=2))
        return
    if args.command == "rename" and (args.song_id is None or args.to is None):
        parser.error(
            "rename requires --song-id and --to (language/title relative folder)"
        )
    import app.core.models  # noqa: F401 -- register referenced FK metadata
    from app.core.config import Settings

    settings = Settings()
    if settings.database_url is None:
        parser.error("CHORD_DATABASE_URL must be configured for sync/rename")
    db = Database(settings.database_url.get_secret_value())
    try:
        print(
            json.dumps(
                sync_local_catalog(
                    db,
                    args.root,
                    (args.song_id, args.to) if args.command == "rename" else None,
                ),
                ensure_ascii=True,
                indent=2,
            )
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
