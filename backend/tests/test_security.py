import json
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr, ValidationError
from sqlalchemy import delete, func, select

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.catalog.custom_chords import CustomChordRecord
from app.modules.catalog.patterns import PatternFavorite, PatternRecord
from app.modules.catalog.songs import SongImportRecord
from app.modules.content_management.models import (
    ContentAudit,
    ContentReport,
    ReferenceContent,
)
from app.modules.identity.adapters import Delivery
from app.modules.identity.models import (
    AccountRecord,
    RateRecord,
    SessionRecord,
    TokenRecord,
)
from app.modules.integration.models import (
    AssessmentRecord,
    ReminderDeliveryRecord,
    ReminderRecord,
)
from app.modules.personal_workspace.models import NoteRecord
from app.modules.personal_workspace.workspace import SongReference, WorkspaceRecord
from app.modules.practice.models import (
    ActivityRecord,
    GoalRecord,
    PracticeRecord,
    PracticeStartRecord,
    RoutineRecord,
)
from app.modules.practice.progress_models import MilestoneRecord, ReviewRecord
from app.modules.security.domain import export_value
from app.modules.security.maintenance import sweep
from app.modules.security.service import RESOURCES

PASSWORD = "Private security browser phrase 123!"
ORIGIN = {"Origin": "http://127.0.0.1:3000"}


@pytest.mark.parametrize(
    "origin",
    [
        "*",
        "https://*.example.com",
        "https://example.com/path",
        "https://name:secret@example.com",
        "https://example.com?q=secret",
        "https://example.com#fragment",
        "file://example.com",
    ],
)
def test_origins_reject_wildcards_paths_and_credentials(origin):
    with pytest.raises(ValidationError):
        Settings(trusted_origins=[origin])


def test_transport_headers_body_limit_and_cors():
    app = create_app(
        Settings(
            environment="production",
            smtp_host="mail.example.com",
            trusted_origins=["https://app.example.com"],
        )
    )
    with TestClient(app, base_url="https://app.example.com") as client:
        response = client.get(
            "/api/v1/health/live", headers={"Origin": "https://evil.example"}
        )
        assert response.status_code == 200
        assert response.headers["strict-transport-security"] == "max-age=31536000"
        assert response.headers["cache-control"] == "no-store"
        assert response.headers["x-content-type-options"] == "nosniff"
        assert response.headers["x-frame-options"] == "DENY"
        assert "access-control-allow-origin" not in response.headers
        assert (
            client.get("http://app.example.com/api/v1/health/live").status_code == 400
        )
        assert client.get("/docs").status_code == 404
        assert (
            client.options(
                "/api/v1/me",
                headers={
                    "Origin": "https://evil.example",
                    "Access-Control-Request-Method": "POST",
                },
            ).status_code
            == 405
        )
        assert (
            client.post(
                "/api/v1/auth/login",
                content=b"{}",
                headers={"Content-Length": "8388609"},
            ).status_code
            == 413
        )
        assert (
            client.post(
                "/api/v1/auth/login", headers={"Content-Length": "invalid"}
            ).status_code
            == 400
        )
        assert client.post(
            "/api/v1/auth/login", content=(b"x" * 1048576 for _ in range(9))
        ).status_code in (400, 413)


def test_export_value_is_plain_json_and_codes_are_minimized(tmp_path):
    identifier = uuid4()
    assert export_value(
        {"nested": [identifier, datetime(2026, 11, 11, tzinfo=UTC), None]}
    ) == {"nested": [str(identifier), "2026-11-11T00:00:00+00:00", None]}
    with pytest.raises(TypeError):
        export_value(object())
    delivery = Delivery(Settings(mail_directory=str(tmp_path)))
    delivery.send("one@example.com", "verify", "first-private-code")
    first = next(tmp_path.glob("*.json"))
    delivery.send("two@example.com", "reset", "second-private-code")
    delivery.forget("ONE@example.com")
    assert not first.exists() and len(list(tmp_path.glob("*.json"))) == 1
    remaining = next(tmp_path.glob("*.json"))
    os.utime(remaining, (0, 0))
    assert delivery.purge_expired() == 1


@pytest.fixture
def db(monkeypatch):
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    database = Database(url)
    yield database
    database.close()


def register(client, folder):
    email = uuid4().hex + "@example.com"
    assert (
        client.post(
            "/api/v1/auth/register",
            headers=ORIGIN,
            json=dict(
                email=email,
                password=PASSWORD,
                display_name="Security test",
                acknowledge_privacy=True,
            ),
        ).status_code
        == 201
    )
    captured = next(
        json.loads(p.read_text())
        for p in folder.glob("*.json")
        if json.loads(p.read_text())["recipient"] == email
    )
    assert (
        client.post(
            "/api/v1/auth/verify/confirm",
            headers=ORIGIN,
            json={"token": captured["token"]},
        ).status_code
        == 200
    )
    login = client.post(
        "/api/v1/auth/login", headers=ORIGIN, json=dict(email=email, password=PASSWORD)
    )
    assert login.status_code == 200
    return login.json(), ORIGIN | {"X-CSRF-Token": login.json()["csrf_token"]}


def populate(db, owner, marker, song):
    now = datetime.now(UTC)
    chord, routine, pattern, practice, collection = [uuid4() for _ in range(5)]
    with db.transaction() as s:
        s.add_all(
            [
                NoteRecord(id=uuid4(), owner_id=owner, body=marker),
                CustomChordRecord(
                    id=chord,
                    owner_id=owner,
                    name=marker,
                    instrument="guitar",
                    frets=[-1, 3, 2, 0, 1, 0],
                    fingers=[0, 3, 2, 0, 1, 0],
                ),
                RoutineRecord(
                    id=routine,
                    owner_id=owner,
                    client_key=uuid4(),
                    creation_hash="a" * 64,
                    name=marker,
                    description=marker,
                    instrument="acoustic_guitar",
                    version=1,
                ),
                PatternRecord(
                    id=pattern,
                    owner_id=owner,
                    status="private",
                    name=marker,
                    meter="4/4",
                    subdivision=1,
                    strokes=["D"] * 4,
                    tempo_min=60,
                    tempo_max=120,
                    difficulty="beginner",
                    style="General",
                    description=marker,
                ),
                GoalRecord(
                    id=uuid4(),
                    owner_id=owner,
                    period="daily",
                    minutes=15,
                    paused=False,
                    version=1,
                    effective_from=now,
                ),
                MilestoneRecord(
                    owner_id=owner,
                    instrument="acoustic_guitar",
                    milestone="first-chords",
                    completed_at=now,
                ),
                ReviewRecord(
                    owner_id=owner, week="2026-11-09", improvement=marker, version=1
                ),
                ContentReport(
                    id=uuid4(),
                    owner_id=owner,
                    kind="chord",
                    key="shared-chord",
                    message=marker,
                    status="open",
                    revision=1,
                ),
                ReminderRecord(
                    owner_id=owner,
                    enabled=False,
                    browser_notifications=False,
                    local_time="18:00",
                    weekdays=[0],
                    version=1,
                ),
                ReminderDeliveryRecord(owner_id=owner, local_day=now.date()),
                AssessmentRecord(
                    id=uuid4(),
                    owner_id=owner,
                    client_key=uuid4(),
                    fingerprint="b" * 64,
                    payload={"notes": marker, "chords": ["C", "G"]},
                ),
                WorkspaceRecord(
                    id=collection,
                    owner_id=owner,
                    kind="collection",
                    title=marker,
                    body=marker,
                    priority="normal",
                    category="",
                    completed=False,
                ),
            ]
        )
        s.flush()
        s.add_all(
            [
                WorkspaceRecord(
                    id=uuid4(),
                    owner_id=owner,
                    kind="favorite",
                    title=marker,
                    body=marker,
                    priority="normal",
                    category="",
                    completed=False,
                    collection_id=collection,
                    song_id=song,
                ),
                ActivityRecord(
                    id=uuid4(),
                    routine_id=routine,
                    position=0,
                    name=marker,
                    duration_seconds=60,
                    tool="chords",
                    bpm=60,
                    chord_id=chord,
                    chord_name="C",
                ),
                PatternFavorite(owner_id=owner, pattern_id=pattern),
                PracticeRecord(
                    id=practice,
                    owner_id=owner,
                    state="saved",
                    instrument="acoustic_guitar",
                    focus=marker,
                    notes=marker,
                    chord_id=chord,
                    chord_name="C",
                    routine_id=routine,
                    routine_snapshot={"name": marker},
                    timezone="UTC",
                    started_at=now - timedelta(seconds=60),
                    ended_at=now,
                    running_since=None,
                    intervals=[
                        {
                            "start": (now - timedelta(seconds=60)).isoformat(),
                            "end": now.isoformat(),
                        }
                    ],
                    duration_seconds=60,
                    version=1,
                ),
            ]
        )
        s.flush()
        s.add(
            PracticeStartRecord(
                owner_id=owner,
                client_key=uuid4(),
                session_id=practice,
                creation_hash="c" * 64,
            )
        )
    return chord, routine, pattern, practice


def test_full_export_ownership_confirmed_deletion_and_other_account_survival(
    db, tmp_path
):
    from uuid import UUID

    app = create_app(
        Settings(
            environment="test",
            database_url=SecretStr(db.engine.url.render_as_string(hide_password=False)),
            auth_limit=200,
            mail_directory=str(tmp_path),
        )
    )
    song = uuid4()
    with db.transaction() as s:
        s.add(
            SongReference(
                id=song,
                title="Synthetic shared reference",
                artist="Test",
                language="en",
                reviewed=True,
            )
        )
    with TestClient(app) as first, TestClient(app) as second, TestClient(app) as guest:
        a, ah = register(first, tmp_path)
        b, bh = register(second, tmp_path)
        owner, other = UUID(a["id"]), UUID(b["id"])
        ids = populate(db, owner, "Owner private marker", song)
        populate(db, other, "Other private marker", song)
        audit_id, import_id = uuid4(), uuid4()
        with db.transaction() as s:
            s.add(
                ContentAudit(
                    id=audit_id,
                    actor_id=owner,
                    kind="chord",
                    key="shared-chord",
                    action="draft",
                )
            )
            s.add(
                ReferenceContent(
                    kind="chord",
                    key=str(audit_id),
                    status="draft",
                    document={"name": "Shared contribution"},
                    revision=1,
                    actor_id=owner,
                )
            )
            s.add(
                SongImportRecord(
                    id=import_id,
                    key=str(import_id),
                    fingerprint="d" * 64,
                    state="staged",
                    payload={"supplier": "not personal export"},
                    versions={},
                    issues=[],
                    actor_id=owner,
                )
            )
        body = {"current_password": PASSWORD, "confirm": True}
        assert (
            guest.post("/api/v1/me/export", headers=ORIGIN, json=body).status_code
            == 401
        )
        assert (
            first.post("/api/v1/me/export", headers=ORIGIN, json=body).status_code
            == 403
        )
        assert (
            first.post(
                "/api/v1/me/export", headers=ah, json=body | {"owner_id": str(other)}
            ).status_code
            == 422
        )
        assert (
            first.post(
                "/api/v1/me/export",
                headers=ah,
                json=body | {"current_password": "wrong"},
            ).status_code
            == 403
        )
        assert (
            first.post(
                "/api/v1/me/export", headers=ah, json=body | {"confirm": False}
            ).status_code
            == 403
        )
        exported = first.post("/api/v1/me/export", headers=ah, json=body)
        assert (
            exported.status_code == 200
            and exported.headers["cache-control"] == "no-store"
        )
        assert "attachment" in exported.headers["content-disposition"]
        document = exported.json()
        assert document["format"] == "chord-house.personal-data.v1"
        assert document["profile"]["id"] == str(owner)
        assert (
            "Other private marker" not in exported.text
            and b["email"] not in exported.text
        )
        assert (
            "Owner private marker" in exported.text
            and "not personal export" not in exported.text
        )
        assert set(name for name, _, _ in RESOURCES) <= set(document["records"])
        assert all(
            document["records"][name]
            for name, _, _ in RESOURCES
            if name != "pending_email_actions"
        )
        assert first.cookies["chord_session"] not in exported.text
        assert a["csrf_token"] not in exported.text
        assert (
            not {"password_hash", "csrf_token", "token_hash"}
            & document["profile"].keys()
        )
        for path in (
            "workspace",
            "custom-chords",
            "patterns",
            "practice/sessions",
            "integration/assessments",
            "content/reports",
        ):
            result = guest.get("/api/v1/" + path)
            assert result.status_code == 401
            assert result.headers["cache-control"] == "no-store"
        for path, identifier in [
            ("custom-chords", ids[0]),
            ("practice/routines", ids[1]),
            ("patterns", ids[2]),
            ("practice/sessions", ids[3]),
        ]:
            assert (
                second.delete(
                    "/api/v1/" + path + "/" + str(identifier), headers=bh
                ).status_code
                == 404
            )
        assert (
            first.post(
                "/api/v1/me/delete", headers=ah, json=body | {"confirm": False}
            ).status_code
            == 403
        )
        assert (
            first.post(
                "/api/v1/me/delete",
                headers=ah,
                json=body | {"current_password": "wrong"},
            ).status_code
            == 403
        )
        assert first.post("/api/v1/me/delete", headers=ah, json=body).status_code == 200
        assert first.get("/api/v1/me").status_code == 401
        assert second.get("/api/v1/me").status_code == 200
        assert not any(
            json.loads(p.read_text()).get("recipient") == a["email"]
            for p in tmp_path.glob("*.json")
        )
        with db.transaction() as s:
            assert s.get(AccountRecord, owner) is None
            for _, model, _ in RESOURCES:
                assert (
                    s.scalar(
                        select(func.count())
                        .select_from(model)
                        .where(model.owner_id == owner)
                    )
                    == 0
                )
            assert (
                s.scalar(
                    select(func.count())
                    .select_from(PracticeStartRecord)
                    .where(PracticeStartRecord.owner_id == owner)
                )
                == 0
            )
            assert (
                s.scalar(
                    select(func.count())
                    .select_from(ActivityRecord)
                    .where(ActivityRecord.routine_id == ids[1])
                )
                == 0
            )
            assert s.get(ContentAudit, audit_id).actor_id is None
            assert s.get(SongImportRecord, import_id).actor_id is None
            assert s.get(ReferenceContent, ("chord", str(audit_id))).actor_id is None
            assert s.get(SongReference, song) is not None
        # Remaining owner can still export; the deleted owner's payload cannot reappear.
        other_export = second.post("/api/v1/me/export", headers=bh, json=body)
        assert (
            other_export.status_code == 200
            and "Owner private marker" not in other_export.text
        )
        assert (
            first.post(
                "/api/v1/auth/login",
                headers=ORIGIN,
                json={"email": a["email"], "password": PASSWORD},
            ).status_code
            == 401
        )
        assert (
            second.post("/api/v1/me/delete", headers=bh, json=body).status_code == 200
        )
    with db.transaction() as s:
        s.execute(delete(ReferenceContent).where(ReferenceContent.key == str(audit_id)))
        s.execute(delete(ContentAudit).where(ContentAudit.id == audit_id))
        s.execute(delete(SongImportRecord).where(SongImportRecord.id == import_id))
        s.execute(delete(SongReference).where(SongReference.id == song))


def test_expired_security_sweep_preserves_live_rows(db):
    owner = uuid4()
    now = datetime.now(UTC)
    expired, live = uuid4().hex * 2, uuid4().hex * 2
    with db.transaction() as s:
        s.add(AccountRecord(id=owner))
        s.flush()
        s.add_all(
            [
                SessionRecord(
                    owner_id=owner,
                    token_hash=expired,
                    csrf_token="a" * 64,
                    last_seen=now - timedelta(days=2),
                    expires_at=now + timedelta(days=1),
                ),
                SessionRecord(
                    owner_id=owner,
                    token_hash=live,
                    csrf_token="b" * 64,
                    last_seen=now,
                    expires_at=now + timedelta(days=1),
                ),
                TokenRecord(
                    owner_id=owner,
                    token_hash=expired,
                    purpose="reset",
                    expires_at=now - timedelta(seconds=1),
                ),
                RateRecord(key=expired, hits=1, expires_at=now - timedelta(seconds=1)),
            ]
        )
    sweep(db, now)
    with db.transaction() as s:
        assert (
            s.get(SessionRecord, expired) is None
            and s.get(SessionRecord, live) is not None
        )
        assert (
            s.get(TokenRecord, expired) is None and s.get(RateRecord, expired) is None
        )
        s.execute(delete(AccountRecord).where(AccountRecord.id == owner))


def test_runtime_role_cannot_migrate_or_administer_database(db):
    from security_support import runtime_database
    from sqlalchemy.exc import DBAPIError

    owner = uuid4()
    with pytest.raises(RuntimeError):
        db.require_runtime_privileges()
    with runtime_database(db) as runtime:
        runtime.require_runtime_privileges()
        with db.transaction() as session:
            session.add(AccountRecord(id=owner))
        try:
            with runtime.transaction() as session:
                session.add(
                    NoteRecord(
                        id=uuid4(), owner_id=owner, body="Least privilege runtime write"
                    )
                )
            with pytest.raises(DBAPIError), runtime.engine.begin() as connection:
                connection.exec_driver_sql(
                    "CREATE TABLE public.security_should_not_exist (id integer)"
                )
        finally:
            with db.transaction() as session:
                session.execute(delete(AccountRecord).where(AccountRecord.id == owner))
