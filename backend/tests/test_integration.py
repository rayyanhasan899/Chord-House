import os
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import delete, select
from test_integration_domain import assessment

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.identity.domain import IdentityError
from app.modules.identity.models import AccountRecord
from app.modules.integration.models import (
    AssessmentRecord,
    ReminderDeliveryRecord,
    ReminderRecord,
)
from app.modules.integration.schemas import ReminderInput
from app.modules.integration.service import Integration
from app.modules.practice.progress_service import Progress
from app.modules.practice.schemas import GoalInput
from app.modules.practice.service import Practice


@pytest.fixture
def database(monkeypatch):
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    db = Database(url)
    yield db
    db.close()


def test_private_assessment_retries_deletion_cascade_and_no_practice_credit(database):
    owner, other = uuid4(), uuid4()
    with database.transaction() as session:
        session.add_all([AccountRecord(id=owner), AccountRecord(id=other)])
    service = Integration(database)
    data = assessment()
    with ThreadPoolExecutor(2) as pool:
        rows = list(pool.map(lambda _: service.save_assessment(owner, data), range(2)))
    assert rows[0].id == rows[1].id
    assert len(service.assessments(owner, 0, 50)) == 1
    assert service.assessments(other, 0, 50) == []
    assert Progress(database).summary(owner).total_seconds == 0
    with pytest.raises(IdentityError) as e:
        service.save_assessment(owner, data.model_copy(update={"changes": 5}))
    assert e.value.status == 409
    with pytest.raises(IdentityError) as e:
        service.delete_assessment(other, rows[0].id)
    assert e.value.status == 404
    service.delete_assessment(owner, rows[0].id)
    assert service.assessments(owner, 0, 50) == []
    with pytest.raises(IdentityError) as e:
        service.save_assessment(owner, data)
    assert e.value.status == 410
    with database.transaction() as session:
        row = session.get(AssessmentRecord, rows[0].id)
        assert row.payload is None
        session.execute(
            delete(AccountRecord).where(AccountRecord.id.in_([owner, other]))
        )
    with database.transaction() as session:
        assert session.get(AssessmentRecord, rows[0].id) is None


def test_reminder_concurrency_timezone_claims_disable_and_suggestions(database):
    owner, other = uuid4(), uuid4()
    with database.transaction() as session:
        session.add_all(
            [
                AccountRecord(id=owner, timezone="Asia/Karachi", skill="intermediate"),
                AccountRecord(id=other),
            ]
        )
    now = datetime(2026, 11, 9, 13, 0, tzinfo=UTC)
    service = Integration(database, lambda: now)
    assert not service.reminder(owner).enabled
    assert not service.check_reminder(owner).due
    settings = ReminderInput(
        enabled=True,
        browser_notifications=True,
        local_time="18:00",
        weekdays=[0, 1],
        version=0,
    )
    saved = service.update_reminder(owner, settings)
    assert saved.timezone == "Asia/Karachi" and saved.version == 1
    assert service.reminder(other).version == 0
    with ThreadPoolExecutor(2) as pool:
        due = list(pool.map(lambda _: service.check_reminder(owner).due, range(2)))
    assert sum(due) == 1
    assert not service.check_reminder(owner).due
    with pytest.raises(IdentityError) as e:
        service.update_reminder(
            owner, settings.model_copy(update={"local_time": "18:01"})
        )
    assert e.value.status == 409
    disabled = service.update_reminder(
        owner,
        settings.model_copy(update={"enabled": False, "weekdays": [], "version": 1}),
    )
    now += timedelta(days=1)
    assert not service.check_reminder(owner).due
    service.update_reminder(
        owner, settings.model_copy(update={"version": disabled.version})
    )
    assert service.check_reminder(owner).due
    # Returning to a previously claimed date cannot deliver it twice.
    now -= timedelta(days=1)
    assert not service.check_reminder(owner).due
    suggestion = service.suggestion(owner)
    assert sum(a.duration_seconds for a in suggestion.activities) == 900
    assert all(a.bpm == 90 for a in suggestion.activities)
    Practice(database, lambda: now).goal(owner, "daily", GoalInput(minutes=10))
    assert sum(a.duration_seconds for a in service.suggestion(owner).activities) == 600
    assert "unsaved 15-minute default" in service.suggestion(other).reason
    with database.transaction() as session:
        session.execute(
            delete(AccountRecord).where(AccountRecord.id.in_([owner, other]))
        )
    with database.transaction() as session:
        assert session.get(ReminderRecord, owner) is None
        assert not list(
            session.scalars(
                select(ReminderDeliveryRecord).where(
                    ReminderDeliveryRecord.owner_id == owner
                )
            )
        )


def test_api_auth_csrf_owner_fields_and_cache(database, tmp_path):
    url = database.engine.url.render_as_string(hide_password=False)
    app = create_app(
        Settings(
            database_url=SecretStr(url),
            environment="test",
            auth_limit=200,
            mail_directory=str(tmp_path),
        )
    )
    origin = {"Origin": "http://127.0.0.1:3000"}
    with TestClient(app) as owner, TestClient(app) as guest:
        for path in ("assessments", "reminder", "suggestion"):
            assert guest.get("/api/v1/integration/" + path).status_code == 401
        email, password = uuid4().hex + "@example.com", "Learning tools phrase 123!"
        assert (
            owner.post(
                "/api/v1/auth/register",
                headers=origin,
                json=dict(
                    email=email,
                    password=password,
                    display_name="Player",
                    acknowledge_privacy=True,
                ),
            ).status_code
            == 201
        )
        login = owner.post(
            "/api/v1/auth/login",
            headers=origin,
            json=dict(email=email, password=password),
        )
        assert login.status_code == 200
        headers = origin | {"X-CSRF-Token": login.json()["csrf_token"]}
        data = assessment().model_dump(mode="json")
        assert (
            owner.post(
                "/api/v1/integration/assessments", headers=origin, json=data
            ).status_code
            == 403
        )
        response = owner.post(
            "/api/v1/integration/assessments", headers=headers, json=data
        )
        assert (
            response.status_code == 201
            and response.headers["cache-control"] == "no-store"
        )
        assert (
            owner.post(
                "/api/v1/integration/assessments",
                headers=headers,
                json=data | {"owner_id": str(uuid4())},
            ).status_code
            == 422
        )
        assert owner.get("/api/v1/integration/reminder").json()["enabled"] is False
        assert (
            owner.post("/api/v1/integration/reminder/check", headers=headers).json()[
                "due"
            ]
            is False
        )
