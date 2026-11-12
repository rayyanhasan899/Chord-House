"""Original fixtures only; never copy the owner's media into CI."""

import os
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import delete, select

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.catalog.asset_models import SongAssetRecord
from app.modules.catalog.local_catalog import scan, sync_local_catalog
from app.modules.catalog.local_storage import LocalSongStorage, lyric_value
from app.modules.catalog.song_routes import byte_range
from app.modules.catalog.song_storage import CHUNK_BYTES, MAX_AUDIO_BYTES
from app.modules.personal_workspace.workspace import SongReference, WorkspaceRecord


def fixture(root: Path, name: str = "Practice") -> Path:
    folder = root / "Urdu songs" / name
    folder.mkdir(parents=True)
    (folder / "audio.mp3").write_bytes(b"ID3" + bytes(range(256)) * 600)
    (folder / "lyrics.txt").write_bytes(
        b"\xef\xbb\xbfCapo 2\r\n\r\n  C\tG\r\nOriginal practice text\r\n"
    )
    return folder


def test_scan_exact_bytes_validation_and_bounded_read(tmp_path: Path) -> None:
    folder = fixture(tmp_path)
    storage = LocalSongStorage(tmp_path)
    key = "Urdu songs/Practice/lyrics.txt"
    assert (
        lyric_value(storage, key)
        == "Capo 2\r\n\r\n  C\tG\r\nOriginal practice text\r\n"
    )
    audio = "Urdu songs/Practice/audio.mp3"
    chunks = list(storage.read(audio))
    assert max(map(len, chunks)) <= CHUNK_BYTES
    assert (
        b"".join(storage.read(audio, 7, 100))
        == (folder / "audio.mp3").read_bytes()[7:107]
    )
    assert storage.describe("../private.txt") is None
    assert len(scan(tmp_path)["entries"]) == 1  # type: ignore[arg-type]
    (folder / "lyrics.txt").write_bytes(b"\xff\xfe")
    assert not scan(tmp_path)["entries"]
    (folder / "lyrics.txt").unlink()
    assert len(scan(tmp_path)["entries"]) == 1  # type: ignore[arg-type]
    with (folder / "audio.mp3").open("wb") as stream:
        stream.truncate(MAX_AUDIO_BYTES + 1)
    assert not scan(tmp_path)["entries"]
    (folder / "audio.mp3").write_bytes(b"not an mp3")
    assert not scan(tmp_path)["entries"]


def test_symlink_and_normalized_collision_are_diagnosed(tmp_path: Path) -> None:
    folder = fixture(tmp_path, "A song")
    fixture(tmp_path, "A  song")
    report = scan(tmp_path)
    assert not report["entries"]
    assert "collision" in str(report["issues"])
    outside = tmp_path / "outside.txt"
    outside.write_text("private", encoding="utf-8")
    (folder / "lyrics.txt").unlink()
    (folder / "lyrics.txt").symlink_to(outside)
    assert LocalSongStorage(tmp_path).describe("Urdu songs/A song/lyrics.txt") is None


@pytest.mark.parametrize(
    "header,expected",
    [
        (None, (0, 99)),
        ("bytes=5-10", (5, 10)),
        ("bytes=95-", (95, 99)),
        ("bytes=-7", (93, 99)),
        ("bytes=0-999", (0, 99)),
    ],
)
def test_byte_ranges(header: str | None, expected: tuple[int, int]) -> None:
    assert byte_range(header, 100) == expected


@pytest.mark.parametrize(
    "header", ["bytes=100-", "bytes=-0", "bytes=9-3", "bytes=-", "bad", "bytes=1-3,7-9"]
)
def test_invalid_ranges(header: str) -> None:
    with pytest.raises(ValueError):
        byte_range(header, 100)


def test_shared_media_authorization_sync_rename_and_missing_source(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    root = tmp_path / "songs"
    folder = fixture(root, "Practice " + uuid4().hex[:12])
    db = Database(url)
    assert sync_local_catalog(db, root)["added"] == 1
    assert sync_local_catalog(db, root)["unchanged"] == 1
    with db.transaction() as session:
        binding = session.scalar(
            select(SongAssetRecord).where(
                SongAssetRecord.source_key == folder.relative_to(root).as_posix()
            )
        )
        assert binding is not None and binding.rights_status == "unverified"
        identifier = binding.song_id
    app = create_app(
        Settings(
            database_url=SecretStr(url),
            environment="test",
            auth_limit=200,
            songs_directory=str(root),
            mail_directory=str(tmp_path / "mail"),
        )
    )
    origin = {"Origin": "http://127.0.0.1:3000"}
    with TestClient(app) as first, TestClient(app) as second, TestClient(app) as guest:
        headers = {}
        for client in (first, second):
            email = uuid4().hex + "@example.com"
            password = "Original practice fixture 123!"
            assert (
                client.post(
                    "/api/v1/auth/register",
                    json=dict(
                        email=email,
                        password=password,
                        display_name="Player",
                        acknowledge_privacy=True,
                    ),
                    headers=origin,
                ).status_code
                == 201
            )
            response = client.post(
                "/api/v1/auth/login",
                json=dict(email=email, password=password),
                headers=origin,
            )
            assert response.status_code == 200
            if client is first:
                headers = origin | {"X-CSRF-Token": response.json()["csrf_token"]}
        base = f"/api/v1/songs/{identifier}"
        for path in (base, base + "/local-files", base + "/audio"):
            assert guest.get(path).status_code == 401
            for client in (first, second):
                assert client.get(path).status_code == 200
        assert guest.head(base + "/audio").status_code == 401
        assert (
            first.get(base + "/local-files").json()["lyrics"]
            == "Capo 2\r\n\r\n  C\tG\r\nOriginal practice text\r\n"
        )
        data = (folder / "audio.mp3").read_bytes()
        assert first.head(base + "/audio").content == b""
        assert first.head(base + "/audio").headers["content-length"] == str(len(data))
        ranged = first.get(base + "/audio", headers={"Range": "bytes=5-25"})
        assert ranged.status_code == 206 and ranged.content == data[5:26]
        assert ranged.headers["content-range"] == f"bytes 5-25/{len(data)}"
        assert ranged.headers["cache-control"] == "private, no-store"
        assert (
            first.get(base + "/audio", headers={"Range": "bytes=99999999-"}).status_code
            == 416
        )
        saved = first.post(
            "/api/v1/workspace",
            json=dict(
                kind="favorite", title="Private favorite", song_id=str(identifier)
            ),
            headers=headers,
        )
        assert saved.status_code == 201
        assert saved.json()["id"] not in [
            i["id"] for i in second.get("/api/v1/workspace").json()
        ]
        assert (
            first.post(
                f"/api/v1/managed-songs/{identifier}/withdraw",
                json={"component": "metadata"},
                headers=headers,
            ).status_code
            == 403
        )
        moved = folder.with_name("Renamed " + uuid4().hex[:12])
        folder.rename(moved)
        unmapped = sync_local_catalog(db, root)
        assert unmapped["added"] == 0 and "rename" in str(unmapped["issues"])
        sync_local_catalog(
            db, root, (UUID(str(identifier)), moved.relative_to(root).as_posix())
        )
        assert first.get(base).json()["title"] == moved.name
        assert first.get(base + "/audio").content == data
        assert first.get("/api/v1/workspace").json()[0]["song_id"] == str(identifier)
        (moved / "lyrics.txt").write_bytes(b"Replacement original text")
        assert sync_local_catalog(db, root)["updated"] == 1
        assert (
            first.get(base + "/local-files").json()["lyrics"]
            == "Replacement original text"
        )
        with db.transaction() as session:
            active = session.get(SongAssetRecord, identifier)
            assert active is not None and active.revision == 3
        missing = root.with_name("temporarily-unavailable")
        root.rename(missing)
        sync_local_catalog(db, root)
        assert first.get(base + "/audio").status_code == 404
        assert first.get("/api/v1/workspace").json()[0]["song_id"] == str(identifier)
        missing.rename(root)
        assert first.get(base + "/audio").status_code == 200
        assert first.post("/api/v1/auth/logout", headers=headers).status_code == 200
        assert first.get(base + "/audio").status_code == 401
    with db.transaction() as session:
        session.execute(
            delete(WorkspaceRecord).where(WorkspaceRecord.song_id == identifier)
        )
        session.execute(delete(SongReference).where(SongReference.id == identifier))
    db.close()
