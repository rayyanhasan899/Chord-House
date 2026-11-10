import json
import os
from contextlib import ExitStack
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr, ValidationError
from sqlalchemy import delete, select

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.catalog.patterns import PatternRecord
from app.modules.catalog.seeds import seed_reference
from app.modules.catalog.songs import SongRecord
from app.modules.content_management.models import (
    ContentAudit,
    ContentReport,
    ReferenceContent,
)
from app.modules.content_management.schemas import (
    ContentWrite,
    PublicChordInput,
    validate_document,
)
from app.modules.content_management.seeds import GRANT
from app.modules.identity.models import AccountRecord
from app.modules.personal_workspace.workspace import SongReference

ORIGIN = {"Origin": "http://127.0.0.1:3000"}


@pytest.mark.parametrize(
    "field,value",
    [
        ("frets", [0, 0, 0, 0, 0, 0]),
        ("name", "D"),
        ("quality", "minor"),
        ("fingers", [0, 0, 0, 0, 0, 0]),
    ],
)
def test_public_voicing_must_match_name_and_fingering(
    field: str, value: object
) -> None:
    data = dict(
        name="C",
        instrument="guitar",
        quality="major",
        frets=[-1, 3, 2, 0, 1, 0],
        fingers=[0, 3, 2, 0, 1, 0],
        grant=GRANT,
    )
    data[field] = value
    with pytest.raises(ValidationError):
        PublicChordInput.model_validate(data)


def test_reference_publication_requires_review_and_current_rights() -> None:
    for changed in (
        {"reviewed": False},
        {"expires_at": datetime.now(UTC) - timedelta(seconds=1)},
        {"territories": ["PK"]},
        {"display": False},
        {"evidence": ""},
    ):
        with pytest.raises(ValueError):
            validate_document(
                "instrument",
                ContentWrite(
                    revision=0,
                    status="published",
                    document=dict(name="Bass", string_count=4, grant=GRANT | changed),
                ),
            )


def test_content_role_matrix_reports_rights_revisions_and_retention(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    db = Database(url)
    app = create_app(
        Settings(
            database_url=SecretStr(url),
            environment="test",
            auth_limit=500,
            mail_directory=str(tmp_path),
        )
    )
    ids: list[UUID] = []
    prefix = "test-" + uuid4().hex
    pattern_key, song_key = str(uuid4()), str(uuid4())
    with ExitStack() as stack:
        users: dict[str, tuple[TestClient, dict[str, str]]] = {}
        for role in ("user", "other", "content_manager", "admin"):
            client = stack.enter_context(TestClient(app))
            email = uuid4().hex + "@example.com"
            password = "Content test long phrase 123!"
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
            ).json()
            ids.append(UUID(response["id"]))
            users[role] = client, ORIGIN | {"X-CSRF-Token": response["csrf_token"]}
            if role in ("admin", "content_manager"):
                with db.transaction() as session:
                    account = session.get(AccountRecord, ids[-1])
                    assert account
                    account.role = role
        guest = stack.enter_context(TestClient(app))
        with db.transaction() as session:
            seed_reference(session)
        manager, headers = users["content_manager"]
        owner, owner_headers = users["user"]
        other, other_headers = users["other"]
        admin, admin_headers = users["admin"]
        for endpoint in (
            "content/song",
            "content/pattern",
            "content/chord",
            "content/instrument",
            "content/tuning",
            "content-audit",
            "content-imports",
            "content-reports?managed=true",
        ):
            assert guest.get("/api/v1/" + endpoint).status_code == 401
            assert owner.get("/api/v1/" + endpoint).status_code == 403
            assert manager.get("/api/v1/" + endpoint).status_code == 200
            assert admin.get("/api/v1/" + endpoint).status_code == 200
        instrument = dict(
            revision=0,
            status="draft",
            document=dict(name="Test instrument", string_count=6, grant=GRANT),
        )
        endpoint = "/api/v1/content/instrument/" + prefix
        assert (
            owner.put(endpoint, json=instrument, headers=owner_headers).status_code
            == 403
        )
        assert guest.put(endpoint, json=instrument, headers=ORIGIN).status_code == 401
        assert manager.put(endpoint, json=instrument, headers=ORIGIN).status_code == 403
        assert (
            manager.put(
                endpoint,
                json=instrument,
                headers=headers | {"Origin": "https://evil.example"},
            ).status_code
            == 403
        )
        result = manager.put(endpoint, json=instrument, headers=headers)
        assert result.status_code == 200, result.text
        assert result.json()["revision"] == 1
        instrument["revision"] = 1
        instrument["status"] = "published"
        assert (
            admin.put(endpoint, json=instrument, headers=admin_headers).status_code
            == 200
        )
        assert (
            manager.put(endpoint, json=instrument, headers=headers).status_code == 409
        )
        refs = guest.get("/api/v1/reference-content/instrument").json()
        assert any(row["key"] == prefix and row["actor_id"] is None for row in refs)
        tuning = dict(
            revision=0,
            status="published",
            document=dict(
                name="Test tuning",
                instrument=prefix,
                pitches=[40, 45, 50, 55, 59, 64],
                grant=GRANT,
            ),
        )
        tune_endpoint = "/api/v1/content/tuning/" + prefix
        assert (
            manager.put(tune_endpoint, json=tuning, headers=headers).status_code == 200
        )
        instrument["revision"] = 2
        instrument["document"]["string_count"] = 4  # type: ignore[index]
        assert (
            manager.put(endpoint, json=instrument, headers=headers).status_code == 409
        )
        instrument["document"]["string_count"] = 6  # type: ignore[index]
        instrument["status"] = "archived"
        assert (
            manager.put(endpoint, json=instrument, headers=headers).status_code == 200
        )
        assert not any(
            row["key"] == prefix
            for row in guest.get("/api/v1/reference-content/tuning").json()
        )
        # Private reports do not leak accounts, and other users cannot resolve them.
        chord = dict(
            revision=0,
            status="published",
            document=dict(
                name="C",
                instrument="guitar",
                quality="major",
                frets=[-1, 3, 2, 0, 1, 0],
                fingers=[0, 3, 2, 0, 1, 0],
                grant=GRANT,
            ),
        )
        chord_endpoint = "/api/v1/content/chord/" + prefix
        assert (
            manager.put(chord_endpoint, json=chord, headers=headers).status_code == 200
        )
        report = owner.post(
            "/api/v1/content-reports",
            json=dict(kind="chord", key=prefix, message="Please review this fingering"),
            headers=owner_headers,
        )
        assert report.status_code == 201
        report_id = report.json()["id"]
        assert owner.get("/api/v1/content-reports").json()[0]["id"] == report_id
        assert other.get("/api/v1/content-reports").json() == []
        assert guest.get("/api/v1/content-reports").status_code == 401
        report_url = "/api/v1/content-reports/" + report_id
        assert (
            other.put(
                report_url,
                json=dict(revision=1, status="dismissed"),
                headers=other_headers,
            ).status_code
            == 403
        )
        assert (
            manager.put(
                report_url, json=dict(revision=1, status="corrected"), headers=headers
            ).status_code
            == 200
        )
        assert (
            manager.put(
                report_url, json=dict(revision=1, status="dismissed"), headers=headers
            ).status_code
            == 409
        )
        queue = manager.get("/api/v1/content-reports?managed=true").text
        assert "owner_id" not in queue and "@example.com" not in queue
        trail = manager.get("/api/v1/content-audit").text
        assert (
            "Please review" not in trail
            and "@example.com" not in trail
            and "csrf" not in trail
            and "evidence" not in trail
        )
        assert (
            manager.get("/api/v1/content-audit").headers["cache-control"] == "no-store"
        )
        # Recheck expiry at read and publication time, without a scheduler.
        expired = dict(
            GRANT, expires_at=(datetime.now(UTC) - timedelta(seconds=1)).isoformat()
        )
        chord["revision"] = 1
        chord["document"]["grant"] = expired  # type: ignore[index]
        assert (
            manager.put(chord_endpoint, json=chord, headers=headers).status_code == 422
        )
        with db.transaction() as session:
            ref = session.get(ReferenceContent, ("chord", prefix))
            assert ref
            ref.document = dict(ref.document, grant=expired)
        assert not any(
            row["key"] == prefix
            for row in guest.get("/api/v1/reference-content/chord?limit=100").json()
        )
        # Managers cannot adopt or read a user's private pattern.
        rhythm = dict(name="Private", meter="4/4", subdivision=1, strokes=["D"] * 4)
        private = owner.post(
            "/api/v1/patterns", json=rhythm, headers=owner_headers
        ).json()
        shared = dict(
            revision=0,
            status="published",
            document=rhythm
            | dict(
                reviewed=True,
                rights_statement="Original test exercise",
                attribution="Tests",
                grant=GRANT,
            ),
        )
        assert (
            manager.put(
                "/api/v1/content/pattern/" + private["id"], json=shared, headers=headers
            ).status_code
            == 404
        )
        assert (
            owner.post(
                "/api/v1/content-reports",
                json=dict(kind="pattern", key=private["id"], message="private"),
                headers=owner_headers,
            ).status_code
            == 404
        )
        assert (
            manager.put(
                "/api/v1/content/pattern/" + pattern_key, json=shared, headers=headers
            ).status_code
            == 200
        )
        with db.transaction() as session:
            pattern = session.get(PatternRecord, UUID(pattern_key))
            assert pattern
            pattern.grant = expired
        assert not any(
            row["id"] == pattern_key for row in owner.get("/api/v1/patterns").json()
        )
        # Song draft/publish/archive preserves identity and per-component withdrawal.
        song = json.loads(
            (
                Path(__file__).parents[1]
                / "app/modules/catalog/data/original-songs.json"
            ).read_text(encoding="utf-8")
        )[0]
        song["external_key"] = prefix
        song["title"] = prefix
        song_write = dict(revision=0, status="draft", document=song)
        song_endpoint = "/api/v1/content/song/" + song_key
        assert (
            manager.put(song_endpoint, json=song_write, headers=headers).status_code
            == 200
        )
        assert owner.get("/api/v1/songs/" + song_key).status_code == 404
        song_write.update(revision=1, status="published")
        assert (
            manager.put(song_endpoint, json=song_write, headers=headers).status_code
            == 200
        )
        assert owner.get("/api/v1/songs/" + song_key).status_code == 200
        first_text = song["texts"][0]["key"]
        assert (
            manager.post(
                "/api/v1/managed-songs/" + song_key + "/withdraw",
                json=dict(component="text", key=first_text),
                headers=headers,
            ).status_code
            == 204
        )
        visible = owner.get("/api/v1/songs/" + song_key).json()
        assert not any(t["key"] == first_text for t in visible["texts"])
        song_write.update(revision=3, status="archived")
        assert (
            manager.put(song_endpoint, json=song_write, headers=headers).status_code
            == 200
        )
        assert owner.get("/api/v1/songs/" + song_key).status_code == 404
        # Reports cascade on deletion; audit actor references anonymize.
        with db.transaction() as session:
            session.execute(delete(AccountRecord).where(AccountRecord.id.in_(ids)))
            session.flush()
            assert session.get(ContentReport, UUID(report_id)) is None
            assert all(
                a.actor_id is None
                for a in session.scalars(
                    select(ContentAudit).where(ContentAudit.key == prefix)
                )
            )
            session.execute(
                delete(ReferenceContent).where(ReferenceContent.key == prefix)
            )
            session.execute(delete(SongRecord).where(SongRecord.id == UUID(song_key)))
            session.execute(
                delete(SongReference).where(SongReference.id == UUID(song_key))
            )
            session.execute(
                delete(PatternRecord).where(PatternRecord.id == UUID(pattern_key))
            )
    db.close()
