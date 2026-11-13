"""Cloud lifecycle on disposable PostgreSQL and an in-memory S3 protocol fixture."""

import os
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import delete, select
from test_object_storage import Client

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.catalog import media_storage
from app.modules.catalog.asset_models import SongAssetRecord
from app.modules.catalog.cloud_catalog import cleanup, plan, rollback, sync
from app.modules.catalog.local_catalog import scan
from app.modules.catalog.media_storage import MediaStorage
from app.modules.catalog.object_storage import ObjectSongStorage
from app.modules.catalog.songs import SongImportRecord, Songs
from app.modules.personal_workspace.workspace import SongReference, WorkspaceRecord


def original(root: Path) -> tuple[str, dict[str, object]]:
    key = "English songs/Original " + uuid4().hex[:12]
    folder = root / key
    folder.mkdir(parents=True)
    (folder / "lyrics.txt").write_bytes(b"Original test\r\n\r\n C\tG\r\n")
    (folder / "audio.mp3").write_bytes(b"ID3" + bytes(range(256)) * 600)
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


def test_cloud_media_and_private_picker_without_original_mount(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    source = tmp_path / "source"
    key, rights = original(source)
    objects = ObjectSongStorage(Client(), "private-test")
    db = Database(url)
    identifier: UUID | None = None
    try:
        migrated = sync(db, source, objects, rights)
        assert migrated["results"][0]["state"] == "active"
        with db.transaction() as session:
            binding = session.scalar(
                select(SongAssetRecord).where(SongAssetRecord.source_key == key)
            )
            assert binding is not None
            identifier = binding.song_id
        monkeypatch.setattr(media_storage, "object_storage", lambda bucket: objects)
        app = create_app(
            Settings(
                database_url=SecretStr(url),
                environment="test",
                auth_limit=200,
                object_bucket="private-test",
                songs_directory=str(tmp_path / "not-mounted"),
                mail_directory=str(tmp_path / "mail"),
            )
        )
        origin = {"Origin": "http://127.0.0.1:3000"}
        with (
            TestClient(app) as first,
            TestClient(app) as second,
            TestClient(app) as guest,
        ):
            headers = []
            for client in (first, second):
                email = uuid4().hex + "@example.com"
                password = "Original cloud fixture password 123!"
                assert client.post(
                    "/api/v1/auth/register",
                    json={
                        "email": email,
                        "password": password,
                        "display_name": "Cloud learner",
                        "acknowledge_privacy": True,
                    },
                    headers=origin,
                ).status_code == 201
                login = client.post(
                    "/api/v1/auth/login",
                    json={"email": email, "password": password},
                    headers=origin,
                )
                assert login.status_code == 200
                headers.append(origin | {"X-CSRF-Token": login.json()["csrf_token"]})
            base = f"/api/v1/songs/{identifier}"
            for client in (first, second):
                assert str(identifier) in [
                    song["id"] for song in client.get("/api/v1/workspace/songs").json()
                ]
                assert client.get(base).status_code == 200
                files = client.get(base + "/local-files")
                assert files.status_code == 200
                assert files.json()["lyrics"] == "Original test\r\n\r\n C\tG\r\n"
                audio = client.get(base + "/audio", headers={"Range": "bytes=5-25"})
                expected = (source / key / "audio.mp3").read_bytes()[5:26]
                assert audio.status_code == 206 and audio.content == expected
                assert client.head(base + "/audio").status_code == 200
            for suffix in ("", "/local-files", "/audio"):
                assert guest.get(base + suffix).status_code == 401
            assert guest.head(base + "/audio").status_code == 401
            favorite = first.post(
                "/api/v1/workspace",
                json={
                    "kind": "favorite",
                    "title": "Private",
                    "song_id": str(identifier),
                },
                headers=headers[0],
            )
            assert favorite.status_code == 201
            favorite_id = favorite.json()["id"]
            assert favorite_id not in [
                item["id"] for item in second.get("/api/v1/workspace").json()
            ]
            assert second.delete(
                f"/api/v1/workspace/{favorite_id}", headers=headers[1]
            ).status_code == 404
            assert first.post(
                f"/api/v1/managed-songs/{identifier}/withdraw",
                json={"component": "metadata"},
                headers=headers[0],
            ).status_code == 403
            assert (
                first.post("/api/v1/auth/logout", headers=headers[0]).status_code == 200
            )
            assert first.get(base + "/audio").status_code == 401
            assert second.get(base + "/audio").status_code == 200
    finally:
        if identifier is not None:
            with db.transaction() as session:
                session.execute(
                    delete(WorkspaceRecord).where(WorkspaceRecord.song_id == identifier)
                )
                session.execute(
                    delete(SongImportRecord).where(
                        SongImportRecord.key.startswith("media:" + identifier.hex)
                    )
                )
                session.execute(
                    delete(SongReference).where(SongReference.id == identifier)
                )
        db.close()
