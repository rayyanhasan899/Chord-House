"""Cloud lifecycle on disposable PostgreSQL and an in-memory S3 protocol fixture."""

import os
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import delete, select
from test_object_storage import Client

from app.core.database import Database
from app.modules.catalog.asset_models import SongAssetRecord
from app.modules.catalog.cloud_catalog import cleanup, plan, rollback, sync
from app.modules.catalog.local_catalog import scan
from app.modules.catalog.media_storage import MediaStorage
from app.modules.catalog.object_storage import ObjectSongStorage
from app.modules.catalog.songs import SongImportRecord, Songs
from app.modules.personal_workspace.workspace import SongReference


def original(root: Path) -> tuple[str, dict[str, object]]:
    key = "English songs/Original " + uuid4().hex[:12]
    folder = root / key
    folder.mkdir(parents=True)
    (folder / "lyrics.txt").write_bytes(b"Original test\r\n\r\n C\tG\r\n")
    entry = scan(root)["entries"][0]  # type: ignore[index]
    return key, {
        key: {
            "source": "Original text authored solely for automated tests",
            "evidence": "Repository test fixture; no third-party song text",
            "sha256": {n: a["sha256"] for n, a in entry["files"].items()},
        }
    }


def test_rights_bound_to_exact_bytes(tmp_path: Path) -> None:
    key, rights = original(tmp_path)
    assert plan(tmp_path, {})["entries"][0]["publication"] == "blocked_rights"
    assert plan(tmp_path, rights)["entries"][0]["publication"] == "eligible"
    (tmp_path / key / "lyrics.txt").write_bytes(b"Different original text")
    assert plan(tmp_path, rights)["entries"][0]["publication"] == "blocked_rights"


def test_copy_resume_cutover_stable_id_and_rollback(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    key, rights = original(tmp_path)
    client = Client()
    objects = ObjectSongStorage(client, "private-test")
    db = Database(url)
    identifier: UUID | None = None
    try:
        client.corrupt = True
        failed = sync(db, tmp_path, objects, rights)
        assert failed["results"][0]["state"] == "failed"
        with db.transaction() as session:
            binding = session.scalar(
                select(SongAssetRecord).where(SongAssetRecord.source_key == key)
            )
            assert binding is not None and binding.source_kind == "local"
            identifier = binding.song_id
        client.corrupt = False
        active = sync(db, tmp_path, objects, rights)
        assert active["results"][0]["state"] == "active"
        assert sync(db, tmp_path, objects, rights)["results"][0]["state"] == "unchanged"
        with db.transaction() as session:
            binding = session.get(SongAssetRecord, identifier)
            assert binding is not None and binding.source_kind == "object"
            assert binding.revision == 2 and binding.rights_status == "verified"
        # No original song mount: catalogue availability comes from private objects.
        missing_root = tmp_path / "no-source-mounted"
        songs = Songs(db, missing_root, MediaStorage(missing_root, objects))
        assert songs.get(identifier).local_lyrics_available
        with pytest.raises(ValueError, match="failed or staged"):
            cleanup(db, objects, UUID(active["results"][0]["job"]))
        rollback(db, UUID(active["results"][0]["job"]))
        with db.transaction() as session:
            binding = session.get(SongAssetRecord, identifier)
            assert binding is not None and binding.source_kind == "local"
            assert binding.revision == 1
        assert (
            tmp_path / key / "lyrics.txt"
        ).read_bytes() == b"Original test\r\n\r\n C\tG\r\n"
    finally:
        if identifier is not None:
            with db.transaction() as session:
                session.execute(
                    delete(SongImportRecord).where(
                        SongImportRecord.key.startswith("media:" + identifier.hex)
                    )
                )
                session.execute(
                    delete(SongReference).where(SongReference.id == identifier)
                )
        db.close()
