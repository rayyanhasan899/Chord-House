import os
from concurrent.futures import ThreadPoolExecutor
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
from app.modules.catalog.patterns import PatternRecord
from app.modules.identity.domain import IdentityError
from app.modules.identity.models import AccountRecord
from app.modules.practice.domain import (
    ActiveInterval,
    elapsed_micros,
    overlaps,
    routine_position,
    validate_saved,
)
from app.modules.practice.models import GoalRecord, PracticeRecord, PracticeStartRecord
from app.modules.practice.schemas import (
    Command,
    GoalInput,
    RoutineCreate,
    RoutineUpdate,
    SessionStart,
    SessionUpdate,
)
from app.modules.practice.service import Practice


def test_exact_intervals_and_timer_boundaries():
    now = datetime(2026, 11, 8, tzinfo=UTC)
    a = ActiveInterval(now, now + timedelta(microseconds=600000))
    b = ActiveInterval(now + timedelta(seconds=2), now + timedelta(seconds=2.6))
    assert elapsed_micros([a, b], None, now) == 1200000
    assert validate_saved([a, b], now + timedelta(seconds=3)) == 1
    assert not overlaps([a], [b])
    assert overlaps([a], [a])
    assert routine_position(60, [60, 90]) == (1, 90)
    assert routine_position(150, [60, 90]) == (2, 0)
    for periods, at in (
        ([a], now),
        ([a, a], now + timedelta(seconds=5)),
        ([], now),
        ([b], now),
    ):
        with pytest.raises(ValueError):
            validate_saved(periods, at)
    with pytest.raises(ValueError):
        ActiveInterval(now.replace(tzinfo=None), now)
    with pytest.raises(ValueError):
        ActiveInterval(now, now - timedelta(seconds=1))


@pytest.mark.parametrize(
    "patch",
    [
        {"target_seconds": True},
        {"target_seconds": 0},
        {"target_seconds": 86401},
        {"owner_id": str(uuid4())},
        {"chord_name": "<script>"},
        {"instrument": "piano"},
    ],
)
def test_practice_input_rejects_invalid_values(patch):
    with pytest.raises(ValidationError):
        SessionStart.model_validate(
            {"client_key": str(uuid4()), "instrument": "acoustic_guitar"} | patch
        )


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


def test_session_lifecycle_retries_pauses_corrections_goals_and_ownership(database):
    db = database
    owner, other = uuid4(), uuid4()
    with db.transaction() as session:
        session.add_all(
            [AccountRecord(id=owner, timezone="Asia/Karachi"), AccountRecord(id=other)]
        )
    now = datetime(2026, 11, 8, tzinfo=UTC)
    svc = Practice(db, lambda: now)
    start = SessionStart(client_key=uuid4(), instrument="acoustic_guitar")
    row = svc.start(owner, start)
    assert row.timezone == "Asia/Karachi"
    assert svc.start(owner, start).id == row.id
    assert svc.history(owner, 0, 100) == []
    with pytest.raises(IdentityError) as e:
        svc.start(owner, start.model_copy(update={"client_key": uuid4()}))
    assert e.value.status == 409
    now += timedelta(microseconds=600000)
    paused = svc.command(owner, row.id, "pause", Command(version=row.version))
    now += timedelta(hours=2)
    assert svc.current(owner).duration_seconds == 0
    resumed = svc.command(owner, row.id, "resume", Command(version=paused.version))
    now += timedelta(microseconds=600000)
    ended = svc.command(owner, row.id, "end", Command(version=resumed.version))
    assert ended.duration_seconds == 1
    saved = svc.command(owner, row.id, "save", Command(version=ended.version))
    assert (
        svc.command(owner, row.id, "save", Command(version=1)).version == saved.version
    )
    assert len(svc.history(owner, 0, 100)) == 1
    assert svc.current(owner) is None
    assert svc.history(other, 0, 100) == []
    for call in (
        lambda: svc.get_session(other, row.id),
        lambda: svc.delete_session(other, row.id, saved.version),
        lambda: svc.command(other, row.id, "save", Command(version=1)),
        lambda: svc.update_session(
            other, row.id, SessionUpdate(instrument="acoustic_guitar", version=1)
        ),
    ):
        with pytest.raises(IdentityError) as e:
            call()
        assert e.value.status == 404
    corrected = svc.update_session(
        owner,
        row.id,
        SessionUpdate(
            instrument="acoustic_guitar",
            version=saved.version,
            notes="Corrected",
            corrected_start=now - timedelta(minutes=10),
            corrected_seconds=60,
        ),
    )
    assert corrected.duration_seconds == 60 and len(corrected.intervals) == 1
    with pytest.raises(IdentityError):
        svc.update_session(
            owner,
            row.id,
            SessionUpdate(
                instrument="acoustic_guitar",
                version=corrected.version,
                corrected_start=now,
                corrected_seconds=60,
            ),
        )
    second = svc.start(owner, start.model_copy(update={"client_key": uuid4()}))
    now += timedelta(seconds=2)
    second = svc.command(owner, second.id, "end", Command(version=second.version))
    second = svc.command(owner, second.id, "save", Command(version=second.version))
    with pytest.raises(IdentityError):
        svc.update_session(
            owner,
            second.id,
            SessionUpdate(
                instrument="acoustic_guitar",
                version=second.version,
                corrected_start=corrected.started_at,
                corrected_seconds=30,
            ),
        )
    daily = svc.goal(owner, "daily", GoalInput(minutes=20))
    assert svc.goal(owner, "daily", GoalInput(minutes=20)).version == daily.version
    now += timedelta(seconds=1)
    paused_goal = svc.goal(
        owner, "daily", GoalInput(minutes=30, paused=True, version=daily.version)
    )
    assert paused_goal.version == 2 and paused_goal.paused
    assert svc.goals(other) == []
    assert len(svc.history(owner, 0, 100)) == 2
    with db.transaction() as session:
        goals = list(
            session.scalars(select(GoalRecord).where(GoalRecord.owner_id == owner))
        )
        assert len(goals) == 2
        assert sum(g.effective_to is None for g in goals) == 1
    svc.delete_session(owner, row.id, corrected.version)
    with pytest.raises(IdentityError) as e:
        svc.start(owner, start)
    assert e.value.status == 410
    with db.transaction() as session:
        session.execute(
            delete(AccountRecord).where(AccountRecord.id.in_([owner, other]))
        )
    with db.transaction() as session:
        for model in (GoalRecord, PracticeRecord, PracticeStartRecord):
            assert (
                session.scalar(
                    select(func.count())
                    .select_from(model)
                    .where(model.owner_id == owner)
                )
                == 0
            )


def test_routine_snapshot_countdown_background_and_concurrent_starts(database):
    db = database
    owner, other = uuid4(), uuid4()
    with db.transaction() as session:
        session.add_all([AccountRecord(id=owner), AccountRecord(id=other)])
    now = datetime(2026, 11, 8, tzinfo=UTC)
    svc = Practice(db, lambda: now)
    data = RoutineCreate(
        client_key=uuid4(),
        name="Daily routine",
        instrument="acoustic_guitar",
        activities=[
            {"name": "Warm up", "duration_seconds": 30, "tool": "metronome"},
            {"name": "Chord changes", "duration_seconds": 60, "tool": "chords"},
        ],
    )
    routine = svc.create_routine(owner, data)
    assert svc.create_routine(owner, data).id == routine.id
    for call in (
        lambda: svc.get_routine(other, routine.id),
        lambda: svc.duplicate_routine(other, routine.id, uuid4()),
        lambda: svc.delete_routine(other, routine.id, routine.version),
        lambda: svc.update_routine(
            other,
            routine.id,
            RoutineUpdate(**data.model_dump(exclude={"client_key"}), version=1),
        ),
    ):
        with pytest.raises(IdentityError) as e:
            call()
        assert e.value.status == 404
    key = uuid4()
    duplicate = svc.duplicate_routine(owner, routine.id, key)
    assert svc.duplicate_routine(owner, routine.id, key).id == duplicate.id
    request = SessionStart(
        client_key=uuid4(), instrument="acoustic_guitar", routine_id=routine.id
    )
    with ThreadPoolExecutor(2) as pool:
        results = list(pool.map(lambda _: svc.start(owner, request), range(2)))
    assert results[0].id == results[1].id
    row = results[0]
    changed = svc.update_routine(
        owner,
        routine.id,
        RoutineUpdate(
            **(
                data.model_dump(exclude={"client_key"})
                | {"activities": list(reversed(data.activities))}
            ),
            version=1,
        ),
    )
    assert changed.activities[0].name == "Chord changes"
    svc.delete_routine(owner, routine.id, changed.version)
    assert (
        svc.get_session(owner, row.id).routine_snapshot.activities[0].name == "Warm up"
    )
    now += timedelta(hours=5)
    row = svc.current(owner)
    assert row.state == "ended" and row.duration_seconds == 90
    assert row.ended_at == row.started_at + timedelta(seconds=90)
    row = svc.command(owner, row.id, "save", Command(version=row.version))
    assert row.duration_seconds == 90

    # Separate simultaneous starts cannot create two open sessions.
    def attempt(_):
        try:
            return svc.start(
                owner, SessionStart(client_key=uuid4(), instrument="acoustic_guitar")
            ).id
        except IdentityError as error:
            assert error.status == 409
            return None

    with ThreadPoolExecutor(2) as pool:
        assert sum(x is not None for x in pool.map(attempt, range(2))) == 1
    with db.transaction() as session:
        session.execute(
            delete(AccountRecord).where(AccountRecord.id.in_([owner, other]))
        )


def test_zero_and_long_session_safeguards(database):
    owner = uuid4()
    with database.transaction() as session:
        session.add(AccountRecord(id=owner))
    now = datetime(2026, 11, 8, tzinfo=UTC)
    svc = Practice(database, lambda: now)
    row = svc.start(owner, SessionStart(client_key=uuid4(), instrument="bass"))
    row = svc.command(owner, row.id, "end", Command(version=row.version))
    with pytest.raises(IdentityError):
        svc.command(owner, row.id, "save", Command(version=row.version))
    svc.delete_session(owner, row.id, row.version)
    row = svc.start(owner, SessionStart(client_key=uuid4(), instrument="bass"))
    now += timedelta(hours=5)
    row = svc.command(owner, row.id, "end", Command(version=row.version))
    with pytest.raises(IdentityError):
        svc.command(owner, row.id, "save", Command(version=row.version))
    row = svc.command(
        owner, row.id, "save", Command(version=row.version, confirm_long=True)
    )
    assert row.duration_seconds == 18000
    with database.transaction() as session:
        session.execute(delete(AccountRecord).where(AccountRecord.id == owner))


def test_practice_api_auth_csrf_validation_and_privacy(database, tmp_path):
    app = create_app(
        Settings(
            database_url=SecretStr(
                str(database.engine.url.render_as_string(hide_password=False))
            ),
            environment="test",
            auth_limit=200,
            mail_directory=str(tmp_path),
        )
    )
    origin = {"Origin": "http://127.0.0.1:3000"}
    with TestClient(app) as owner, TestClient(app) as other, TestClient(app) as guest:

        def login(client):
            email, password = uuid4().hex + "@example.com", "Practice long phrase 123!"
            assert (
                client.post(
                    "/api/v1/auth/register",
                    headers=origin,
                    json={
                        "email": email,
                        "password": password,
                        "display_name": "Practice player",
                        "acknowledge_privacy": True,
                    },
                ).status_code
                == 201
            )
            response = client.post(
                "/api/v1/auth/login",
                headers=origin,
                json={"email": email, "password": password},
            )
            assert response.status_code == 200
            return origin | {"X-CSRF-Token": response.json()["csrf_token"]}

        headers, other_headers = login(owner), login(other)
        base = "/api/v1/practice"
        assert guest.get(base + "/sessions").status_code == 401
        assert guest.get(base + "/routines").status_code == 401
        assert guest.get(base + "/goals").status_code == 401
        data = {"client_key": str(uuid4()), "instrument": "ukulele"}
        assert (
            owner.post(base + "/sessions", headers=origin, json=data).status_code == 403
        )
        response = owner.post(base + "/sessions", headers=headers, json=data)
        assert response.status_code == 201
        assert response.headers["cache-control"] == "no-store"
        row = response.json()
        assert (
            owner.post(base + "/sessions", headers=headers, json=data).json()["id"]
            == row["id"]
        )
        url = base + "/sessions/" + row["id"]
        assert other.get(url).status_code == 404
        assert (
            other.delete(url + "?version=1", headers=other_headers).status_code == 404
        )
        assert (
            other.post(
                url + "/pause", headers=other_headers, json={"version": 1}
            ).status_code
            == 404
        )
        assert (
            owner.put(
                base + "/goals/daily", headers=headers, json={"minutes": 1441}
            ).status_code
            == 422
        )
        assert (
            owner.post(
                base + "/sessions",
                headers=headers,
                json=data | {"owner_id": str(uuid4())},
            ).status_code
            == 422
        )
        assert owner.delete(url + "?version=1", headers=headers).status_code == 204


def test_link_ownership_missing_targets_and_routine_validation(database):
    owner, other, chord, pattern = (uuid4() for _ in range(4))
    with database.transaction() as session:
        session.add_all([AccountRecord(id=owner), AccountRecord(id=other)])
        session.flush()
        session.add(
            CustomChordRecord(
                id=chord,
                owner_id=other,
                name="C",
                instrument="guitar",
                frets=[-1, 3, 2, 0, 1, 0],
                fingers=[0, 3, 2, 0, 1, 0],
            )
        )
        session.add(
            PatternRecord(
                id=pattern,
                owner_id=other,
                status="private",
                name="Private",
                meter="4/4",
                subdivision=1,
                strokes=list("DDDD"),
                tempo_min=60,
                tempo_max=140,
                difficulty="beginner",
                style="General",
                description="",
            )
        )
    svc = Practice(database)
    for patch in ({"chord_id": chord}, {"song_id": uuid4()}):
        with pytest.raises(IdentityError) as error:
            svc.start(
                owner,
                SessionStart(client_key=uuid4(), instrument="acoustic_guitar", **patch),
            )
        assert error.value.status == 422
    data = dict(
        client_key=uuid4(),
        name="Links",
        instrument="acoustic_guitar",
        activities=[
            dict(
                name="Pattern", duration_seconds=60, tool="pattern", pattern_id=pattern
            )
        ],
    )
    with pytest.raises(IdentityError):
        svc.create_routine(owner, RoutineCreate.model_validate(data))
    routine = svc.create_routine(other, RoutineCreate.model_validate(data))
    linked = svc.create_routine(
        other,
        RoutineCreate(
            client_key=uuid4(),
            name="Chord target",
            instrument="acoustic_guitar",
            activities=[
                dict(name="Shape", duration_seconds=30, tool="chords", chord_id=chord)
            ],
        ),
    )
    with database.transaction() as session:
        session.execute(delete(CustomChordRecord).where(CustomChordRecord.id == chord))
    assert svc.get_routine(other, linked.id).warnings
    with pytest.raises(IdentityError):
        svc.duplicate_routine(other, linked.id, uuid4())
    with database.transaction() as session:
        session.execute(delete(PatternRecord).where(PatternRecord.id == pattern))
    assert svc.get_routine(other, routine.id).warnings
    with pytest.raises(IdentityError):
        svc.start(
            other,
            SessionStart(
                client_key=uuid4(), instrument="acoustic_guitar", routine_id=routine.id
            ),
        )
    with database.transaction() as session:
        session.execute(
            delete(AccountRecord).where(AccountRecord.id.in_([owner, other]))
        )
