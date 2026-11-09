from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.modules.practice.domain import ActiveInterval
from app.modules.practice.progress_domain import daily_micros, streaks, week_start
from app.modules.practice.roadmap import curriculum


@pytest.mark.parametrize(
    "zone,day,hours",
    [
        ("America/New_York", date(2026, 3, 8), 23),
        ("America/New_York", date(2026, 11, 1), 25),
        ("Asia/Karachi", date(2026, 11, 9), 24),
    ],
)
def test_local_day_uses_actual_elapsed_time(zone, day, hours):
    start = datetime.combine(day, datetime.min.time(), ZoneInfo(zone))
    end = datetime.combine(day + timedelta(days=1), datetime.min.time(), ZoneInfo(zone))
    result = daily_micros([ActiveInterval(start, end)], zone)
    assert result == {day: hours * 3600 * 1000000}


def test_allocation_conserves_microseconds_across_zones_and_midnights():
    start = datetime(2026, 11, 1, 3, 59, 59, 123456, tzinfo=UTC)
    for zone in [
        "UTC",
        "Asia/Karachi",
        "America/New_York",
        "Pacific/Apia",
        "Asia/Kathmandu",
    ]:
        for duration in [1, 600001, 3600000000, 86400000000, 172800000001]:
            period = ActiveInterval(start, start + timedelta(microseconds=duration))
            assert sum(daily_micros([period], zone).values()) == duration
    assert daily_micros([ActiveInterval(start, start)], "UTC") == {}


def test_week_and_streak_boundaries_do_not_break_before_today_finishes():
    today = date(2026, 11, 9)
    assert week_start(today) == today
    days = {today - timedelta(days=n) for n in [1, 2, 3, 6]}
    assert streaks(days, today) == (3, 3)
    assert streaks(days | {today}, today) == (4, 4)
    assert streaks(days - {today - timedelta(days=2)}, today) == (1, 1)
    assert streaks(set(), today) == (0, 0)


@pytest.mark.parametrize(
    "instrument", ["acoustic_guitar", "electric_guitar", "bass", "ukulele"]
)
def test_roadmap_prioritizes_level_without_inventing_completion(instrument):
    rows = curriculum(instrument, "intermediate")
    assert rows[0].level == "intermediate"
    assert len({r.code for r in rows}) == len(rows) == 8
    assert all(r.tool.startswith("/") and r.instruction for r in rows)
