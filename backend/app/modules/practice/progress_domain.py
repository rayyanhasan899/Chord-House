"""Calendar allocation with exact UTC durations; no ORM or web dependencies."""

from collections import defaultdict
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.modules.practice.domain import ActiveInterval


def daily_micros(periods: list[ActiveInterval], timezone: str) -> dict[date, int]:
    zone = ZoneInfo(timezone)
    result: dict[date, int] = defaultdict(int)
    for period in periods:
        cursor = period.start
        while cursor < period.end:
            day = cursor.astimezone(zone).date()
            boundary = datetime.combine(
                day + timedelta(days=1), time(), zone
            ).astimezone(UTC)
            # Resolve historical skipped midnights without a non-advancing loop.
            while boundary <= cursor:
                boundary += timedelta(hours=1)
            stop = min(period.end, boundary)
            result[day] += ActiveInterval(cursor, stop).micros
            cursor = stop
    return dict(result)


def week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def streaks(days: set[date], today: date) -> tuple[int, int]:
    days = {d for d in days if d <= today}
    best = count = 0
    previous = None
    for day in sorted(days):
        count = count + 1 if previous and day == previous + timedelta(days=1) else 1
        best = max(best, count)
        previous = day
    cursor = today if today in days else today - timedelta(days=1)
    current = 0
    while cursor in days:
        current += 1
        cursor -= timedelta(days=1)
    return current, best
