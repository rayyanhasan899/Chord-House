import os
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import delete, select

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.identity.domain import IdentityError
from app.modules.identity.models import AccountRecord
from app.modules.practice.progress_models import MilestoneRecord, ReviewRecord
from app.modules.practice.progress_schemas import CompletionInput, ReviewInput
from app.modules.practice.progress_service import Progress
from app.modules.practice.schemas import Command, GoalInput, SessionStart, SessionUpdate
from app.modules.practice.service import Practice


def test_progress_recomputes_saved_edits_deletes_timezone_goals_and_private_roadmap(
    monkeypatch,
):
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    db = Database(url)
    owner, other = uuid4(), uuid4()
    with db.transaction() as session:
        session.add_all([AccountRecord(id=owner), AccountRecord(id=other)])
    now = datetime(2026, 11, 1, tzinfo=UTC)
    practice = Practice(db, lambda: now)
    progress = Progress(db, lambda: now)
    practice.goal(owner, "daily", GoalInput(minutes=30))
    practice.goal(owner, "weekly", GoalInput(minutes=30))
    now = datetime(2026, 11, 8, 23, 30, tzinfo=UTC)
    start = practice.start(
        owner, SessionStart(client_key=uuid4(), instrument="bass", chord_name="C")
    )
    assert progress.summary(owner).total_seconds == 0
    now += timedelta(hours=1)
    ended = practice.command(owner, start.id, "end", Command(version=start.version))
    assert progress.summary(owner).total_seconds == 0
    saved = practice.command(owner, start.id, "save", Command(version=ended.version))
    now = datetime(2026, 11, 9, 12, tzinfo=UTC)
    summary = progress.summary(owner)
    assert summary.total_seconds == 3600
    assert summary.today_seconds == summary.week_seconds == 1800
    assert summary.current_streak == summary.longest_streak == 2
    assert summary.review.seconds == 1800 and summary.review.weekly_goal_met is True
    assert summary.review.achieved_daily_goals == 1
    assert summary.instruments[0].label == "bass"
    assert summary.chords[0].label == "C"
    assert progress.summary(other).total_seconds == 0
    # No read may mutate or count the same saved session again.
    assert progress.summary(owner).total_seconds == summary.total_seconds
    with db.transaction() as session:
        account = session.get(AccountRecord, owner)
        account.timezone = "Asia/Karachi"
    summary = progress.summary(owner)
    assert summary.total_seconds == summary.today_seconds == 3600
    assert summary.current_streak == 1
    practice.goal(owner, "daily", GoalInput(minutes=40, paused=True, version=1))
    assert next(g for g in progress.summary(owner).goals if g.period == "daily").paused
    # Recorded intervals, not prior response/counters, control corrected results.
    corrected = practice.update_session(
        owner,
        saved.id,
        SessionUpdate(
            instrument="bass",
            version=saved.version,
            corrected_start=datetime(2026, 11, 7, 12, tzinfo=UTC),
            corrected_seconds=1200,
        ),
    )
    assert progress.summary(owner).today_seconds == 0
    assert progress.summary(owner).total_seconds == 1200
    practice.delete_session(owner, corrected.id, corrected.version)
    summary = progress.summary(owner)
    assert (
        summary.total_seconds == summary.longest_streak == summary.current_streak == 0
    )
    selected = date(2026, 11, 2)
    progress.review(
        owner, selected, ReviewInput(improvement="Relax my picking hand", version=0)
    )
    assert progress.summary(owner).review.improvement == "Relax my picking hand"
    assert progress.summary(other).review.improvement == ""
    with pytest.raises(IdentityError) as error:
        progress.review(
            owner, selected, ReviewInput(improvement="stale change", version=0)
        )
    assert error.value.status == 409
    for day in [date(2026, 11, 9), date(2026, 11, 8), date(1899, 12, 25)]:
        with pytest.raises(IdentityError):
            progress.summary(owner, day)
    completed = CompletionInput(instrument="acoustic_guitar", completed=True)
    progress.complete(owner, "tuning", completed)
    progress.complete(owner, "tuning", completed)
    assert (
        sum(m.completed_at is not None for m in progress.roadmap(owner).milestones) == 1
    )
    assert not any(m.completed_at for m in progress.roadmap(other).milestones)
    with db.transaction() as session:
        account = session.get(AccountRecord, owner)
        account.instrument, account.skill = "bass", "advanced"
    roadmap = progress.roadmap(owner)
    assert roadmap.milestones[0].level == "advanced"
    assert not any(m.completed_at for m in roadmap.milestones)
    with pytest.raises(IdentityError):
        progress.complete(owner, "tuning", completed)
    with pytest.raises(IdentityError):
        progress.complete(
            owner, "invented", CompletionInput(instrument="bass", completed=True)
        )
    progress.complete(
        owner, "tuning", CompletionInput(instrument="bass", completed=True)
    )
    progress.complete(
        owner, "tuning", CompletionInput(instrument="bass", completed=False)
    )
    assert not any(m.completed_at for m in progress.roadmap(owner).milestones)
    progress.review(owner, selected, ReviewInput(improvement="", version=1))
    assert progress.summary(owner).review.version == 0
    with db.transaction() as session:
        session.execute(
            delete(AccountRecord).where(AccountRecord.id.in_([owner, other]))
        )
    with db.transaction() as session:
        assert not list(
            session.scalars(
                select(MilestoneRecord).where(MilestoneRecord.owner_id == owner)
            )
        )
        assert not list(
            session.scalars(select(ReviewRecord).where(ReviewRecord.owner_id == owner))
        )
    db.close()


def test_progress_endpoints_require_identity():
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    with TestClient(
        create_app(Settings(environment="test", database_url=SecretStr(url)))
    ) as guest:
        for route in ["/progress", "/roadmap"]:
            assert guest.get("/api/v1/practice" + route).status_code == 401
