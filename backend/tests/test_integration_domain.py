from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.modules.integration.domain import reminder_due
from app.modules.integration.schemas import AssessmentInput, ReminderInput


def assessment():
    return AssessmentInput(
        client_key=uuid4(),
        instrument="acoustic_guitar",
        kind="transition",
        chords=["C", "G"],
        seconds=30,
        changes=4,
        difficulty="steady",
        completed=True,
        notes="Relaxed hands",
    )


@pytest.mark.parametrize(
    "patch",
    [
        {"chords": ["C"]},
        {"chords": ["C", "C"]},
        {"chords": ["C", "<script>"]},
        {"seconds": True},
        {"seconds": 0},
        {"changes": -1},
        {"changes": 10001},
        {"instrument": "piano"},
        {"owner_id": str(uuid4())},
    ],
)
def test_assessment_validation(patch):
    with pytest.raises(ValidationError):
        AssessmentInput.model_validate(assessment().model_dump() | patch)


@pytest.mark.parametrize(
    "patch",
    [
        {"weekdays": [True]},
        {"weekdays": [-1]},
        {"weekdays": [0, 0]},
        {"weekdays": []},
        {"local_time": "24:00"},
        {"local_time": "9:05"},
        {"version": True},
        {"owner_id": str(uuid4())},
    ],
)
def test_reminder_validation(patch):
    with pytest.raises(ValidationError):
        ReminderInput.model_validate(
            dict(enabled=True, local_time="18:00", weekdays=[0], version=0) | patch
        )


def test_timezone_due_window_and_dst_fold_no_implicit_catchup():
    now = datetime(2026, 11, 9, 13, 0, tzinfo=UTC)
    assert reminder_due(now, "Asia/Karachi", "18:00", [0], None)
    assert reminder_due(now + timedelta(minutes=9), "Asia/Karachi", "18:00", [0], None)
    assert not reminder_due(
        now + timedelta(minutes=10), "Asia/Karachi", "18:00", [0], None
    )
    assert not reminder_due(now, "Asia/Karachi", "18:01", [0], None)
    assert not reminder_due(now, "Asia/Karachi", "18:00", [1], None)
    assert not reminder_due(now, "Asia/Karachi", "18:00", [0], now.date())
    # Both fall-back occurrences map to the same calendar-day claim.
    fold = datetime(2026, 11, 1, 5, 30, tzinfo=UTC)
    assert reminder_due(fold, "America/New_York", "01:30", [6], None)
    assert reminder_due(
        fold + timedelta(hours=1), "America/New_York", "01:30", [6], None
    )
    assert not reminder_due(
        fold + timedelta(hours=1), "America/New_York", "01:30", [6], fold.date()
    )
    assert not reminder_due(
        datetime(2026, 3, 8, 7, 0, tzinfo=UTC), "America/New_York", "02:30", [6], None
    )
