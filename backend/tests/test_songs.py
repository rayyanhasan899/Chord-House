import json
import os
from datetime import UTC, datetime, timedelta
from importlib.resources import files
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr, ValidationError
from sqlalchemy import func, select

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.catalog.song_domain import chord_valid, normalize
from app.modules.catalog.song_schemas import SongInput
from app.modules.catalog.song_seeds import seed_songs
from app.modules.catalog.songs import SongAuditRecord, SongRecord
from app.modules.identity.models import AccountRecord

ORIGIN = {"Origin": "http://127.0.0.1:3000"}


def original() -> dict[str, object]:
    path = files("app.modules.catalog").joinpath("data", "original-songs.json")
    data: dict[str, object] = json.loads(path.read_text(encoding="utf-8"))[0]
    return data


def test_bundled_song_identity_provenance_and_transliteration() -> None:
    counts: dict[str, int] = {}
    for filename in ("popular-songs.json", "original-songs.json"):
        rows = json.loads(
            files("app.modules.catalog")
            .joinpath("data", filename)
            .read_text(encoding="utf-8")
        )
        for row in rows:
            song = SongInput.model_validate(row)
            counts[song.language] = counts.get(song.language, 0) + 1
            if filename == "popular-songs.json":
                assert not song.texts and not song.arrangements
                assert song.metadata_grant.source_url.startswith(
                    "https://musicbrainz.org/recording/"
                )
            else:
                assert song.texts and len(song.arrangements) == 3
                assert all(t.grant.origin == "application" for t in song.texts)
    assert counts == {"en": 32, "ur": 28, "hi": 31}
    assert normalize("  CHANNA  Mereya ") == "channa mereya"
    for chord in ("C", "F#m7", "Bbmaj7", "G/B", "Ddim", "Esus4", "Aaug"):
        assert chord_valid(chord)
    assert not chord_valid("C<script>")


@pytest.mark.parametrize(
    "field,value",
    [("title", " "), ("language", "xx"), ("lyrics_url", "javascript:alert(1)")],
)
def test_bad_song_input(field: str, value: str) -> None:
    with pytest.raises(ValidationError):
        SongInput.model_validate(original() | {field: value})


def test_song_api_search_import_rights_and_private_saves(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    # This test exercises rights/import behavior with an explicitly supplied
    # folder fixture for each bundled identity, independent of personal files.
    from app.modules.catalog.local_songs import LANGUAGES

    songs_root = tmp_path / "songs"
    for filename in ("popular-songs.json", "original-songs.json"):
        rows = json.loads(
            files("app.modules.catalog")
            .joinpath("data", filename)
            .read_text(encoding="utf-8")
        )
        for row in rows:
            folder = songs_root / LANGUAGES[row["language"]] / row["title"]
            folder.mkdir(parents=True, exist_ok=True)
            (folder / "audio.mp3").write_bytes(b"ID3test-fixture")
    db = Database(url)
    from app.modules.catalog.local_catalog import sync_local_catalog

    with db.transaction() as session:
        seed_songs(session)
    sync_local_catalog(db, songs_root)
    app = create_app(
        Settings(
            database_url=SecretStr(url),
            environment="test",
            auth_limit=200,
            mail_directory=str(tmp_path),
            songs_directory=str(songs_root),
        )
    )
    with (
        TestClient(app) as manager,
        TestClient(app) as owner,
        TestClient(app) as other,
        TestClient(app) as guest,
    ):

        def login(client: TestClient) -> tuple[UUID, dict[str, str]]:
            email = uuid4().hex + "@example.com"
            password = "Song test long phrase 123!"
            assert (
                client.post(
                    "/api/v1/auth/register",
                    json=dict(
                        email=email,
                        password=password,
                        display_name="Player",
                        acknowledge_privacy=True,
                    ),
                    headers=ORIGIN,
                ).status_code
                == 201
            )
            response = client.post(
                "/api/v1/auth/login",
                json=dict(email=email, password=password),
                headers=ORIGIN,
            )
            assert response.status_code == 200
            return UUID(response.json()["id"]), ORIGIN | {
                "X-CSRF-Token": response.json()["csrf_token"]
            }

        manager_id, headers = login(manager)
        _, owner_headers = login(owner)
        _, other_headers = login(other)
        with db.transaction() as session:
            account = session.get(AccountRecord, manager_id)
            assert account is not None
            account.role = "content_manager"
            seed_songs(session)
            seed_songs(session)
            assert session.scalar(select(func.count()).select_from(SongRecord)) == 91
        assert guest.get("/api/v1/songs").status_code == 401
        for language, query in (
            ("en", "WONDER"),
            ("ur", "Aadat"),
            ("hi", "Tum Hi Ho"),
            ("ur", "عادت"),
            ("hi", "तुम ही हो"),
        ):
            response = owner.get(
                "/api/v1/songs", params=dict(language=language, q=query)
            )
            assert response.status_code == 200 and response.json()["total"] > 0
            assert response.headers["cache-control"] == "private, no-store"
        assert owner.get("/api/v1/songs?q=%25").json()["total"] == 0
        page = owner.get("/api/v1/songs?limit=2&offset=2").json()
        assert len(page["items"]) == 2 and page["total"] == 91
        assert owner.get("/api/v1/songs?availability=lyrics").json()["total"] == 6
        assert (
            owner.get("/api/v1/songs?instrument=ukulele&difficulty=beginner").json()[
                "total"
            ]
            == 6
        )
        assert owner.get("/api/v1/songs?artist=Coldplay").json()["total"] >= 3
        item = original() | {
            "external_key": "test:" + uuid4().hex,
            "title": "Rights test " + uuid4().hex[:8],
        }
        request = dict(key=uuid4().hex, items=[item])
        assert (
            owner.post(
                "/api/v1/song-imports", json=request, headers=owner_headers
            ).status_code
            == 403
        )
        assert (
            manager.post(
                "/api/v1/song-imports", json=request, headers=ORIGIN
            ).status_code
            == 403
        )
        preview = manager.post("/api/v1/song-imports", json=request, headers=headers)
        assert preview.status_code == 201 and not preview.json()["issues"]
        import_id = preview.json()["id"]
        assert (
            manager.post("/api/v1/song-imports", json=request, headers=headers).json()[
                "id"
            ]
            == import_id
        )
        assert (
            manager.post(
                "/api/v1/song-imports",
                json=request | {"replace_existing": True},
                headers=headers,
            ).status_code
            == 409
        )
        assert owner.get("/api/v1/song-imports/" + import_id).status_code == 403
        assert (
            owner.get("/api/v1/songs", params={"q": item["title"]}).json()["total"] == 0
        )
        commit = "/api/v1/song-imports/" + import_id + "/commit"
        assert manager.post(commit, headers=headers).status_code == 200
        assert manager.post(commit, headers=headers).status_code == 200
        with db.transaction() as session:
            events = list(
                session.scalars(
                    select(SongAuditRecord).where(
                        SongAuditRecord.import_id == UUID(import_id)
                    )
                )
            )
            assert sorted(e.action for e in events) == ["publish", "stage"]
            assert all(e.actor_id == manager_id for e in events)
        folder = songs_root / LANGUAGES[item["language"]] / item["title"]
        folder.mkdir(parents=True)
        (folder / "audio.mp3").write_bytes(b"ID3test-fixture")
        sync_local_catalog(db, songs_root)
        song = owner.get("/api/v1/songs", params={"q": item["title"]}).json()["items"][
            0
        ]
        song_id = song["id"]
        detail_path = "/api/v1/songs/" + song_id
        detail = owner.get(detail_path).json()
        assert detail["arrangement_count"] == 3 and detail["text_count"] == 1
        saved_data = dict(kind="favorite", title="My private song", song_id=song_id)
        saved = owner.post("/api/v1/workspace", json=saved_data, headers=owner_headers)
        assert saved.status_code == 201
        saved_id = saved.json()["id"]
        assert (
            owner.post(
                "/api/v1/workspace", json=saved_data, headers=owner_headers
            ).json()["id"]
            == saved_id
        )
        assert saved_id not in [i["id"] for i in other.get("/api/v1/workspace").json()]
        assert (
            other.put(
                "/api/v1/workspace/" + saved_id, json=saved_data, headers=other_headers
            ).status_code
            == 404
        )
        assert (
            other.delete(
                "/api/v1/workspace/" + saved_id, headers=other_headers
            ).status_code
            == 404
        )
        private_collection = other.post(
            "/api/v1/workspace",
            json=dict(kind="collection", title="Other collection"),
            headers=other_headers,
        ).json()["id"]
        assert (
            owner.put(
                "/api/v1/workspace/" + saved_id,
                json=saved_data | {"collection_id": private_collection},
                headers=owner_headers,
            ).status_code
            == 422
        )
        duplicate = manager.post(
            "/api/v1/song-imports",
            json=dict(key=uuid4().hex, items=[item]),
            headers=headers,
        )
        assert duplicate.json()["issues"]
        replacement = manager.post(
            "/api/v1/song-imports",
            json=dict(key=uuid4().hex, items=[item], replace_existing=True),
            headers=headers,
        ).json()["id"]
        withdraw = "/api/v1/managed-songs/" + song_id + "/withdraw"
        assert (
            owner.post(
                withdraw,
                json=dict(component="text", key="english"),
                headers=owner_headers,
            ).status_code
            == 403
        )
        assert (
            manager.post(
                withdraw, json=dict(component="text", key="english"), headers=headers
            ).status_code
            == 204
        )
        without_text = owner.get(detail_path).json()
        assert (
            not without_text["texts"]
            and not without_text["arrangements"][0]["placements"]
        )
        assert (
            manager.post(
                "/api/v1/song-imports/" + replacement + "/commit", headers=headers
            ).status_code
            == 409
        )
        assert (
            manager.post(
                withdraw,
                json=dict(component="arrangement", key="guitar-standard"),
                headers=headers,
            ).status_code
            == 204
        )
        assert owner.get(detail_path).json()["arrangement_count"] == 2
        assert (
            manager.post(
                withdraw, json=dict(component="metadata"), headers=headers
            ).status_code
            == 204
        )
        assert owner.get(detail_path).status_code == 404
        with db.transaction() as session:
            events = list(
                session.scalars(
                    select(SongAuditRecord).where(
                        SongAuditRecord.song_id == UUID(song_id)
                    )
                )
            )
            assert {e.action for e in events} == {
                "local-assets-import",
                "withdraw:metadata",
                "withdraw:arrangement",
                "withdraw:text",
            }
        assert (
            owner.get("/api/v1/songs", params={"q": item["title"]}).json()["total"] == 0
        )
        assert (
            owner.post(
                "/api/v1/workspace", json=saved_data, headers=owner_headers
            ).status_code
            == 201
        )
        # New links are denied; historical private saves remain.
        assert (
            other.post(
                "/api/v1/workspace", json=saved_data, headers=other_headers
            ).status_code
            == 422
        )
        invalid = json.loads(json.dumps(item))
        invalid["metadata_grant"]["reviewed"] = False
        invalid["external_key"] = "blocked:" + uuid4().hex
        blocked = manager.post(
            "/api/v1/song-imports",
            json=dict(key=uuid4().hex, items=[invalid]),
            headers=headers,
        ).json()
        assert blocked["issues"]
        assert (
            manager.post(
                "/api/v1/song-imports/" + blocked["id"] + "/commit", headers=headers
            ).status_code
            == 422
        )
        with db.transaction() as session:
            row = session.get(SongRecord, UUID(song_id))
            assert row is not None
            doc = dict(row.document)
            grant = dict(doc["metadata_grant"])  # type: ignore[call-overload]
            grant["expires_at"] = (datetime.now(UTC) - timedelta(seconds=1)).isoformat()
            doc["metadata_grant"] = grant
            row.document = doc
            row.status = "published"
        assert owner.get(detail_path).status_code == 404
        assert (
            owner.get("/api/v1/songs", params={"q": item["title"]}).json()["total"] == 0
        )
    db.close()
