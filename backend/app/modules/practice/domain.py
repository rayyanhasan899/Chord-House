from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

MAX_SECONDS = 86400
LONG_SECONDS = 14400


def aware(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("Use timezone-aware timestamps")
    return value.astimezone(UTC)


def microseconds(value: timedelta) -> int:
    return (value.days * 86400 + value.seconds) * 1000000 + value.microseconds


@dataclass(frozen=True)
class ActiveInterval:
    start: datetime
    end: datetime

    def __post_init__(self) -> None:
        object.__setattr__(self, "start", aware(self.start))
        object.__setattr__(self, "end", aware(self.end))
        if self.end < self.start:
            raise ValueError("An interval cannot end before it starts")

    @property
    def micros(self) -> int:
        return microseconds(self.end - self.start)


def total_micros(intervals: list[ActiveInterval]) -> int:
    previous: datetime | None = None
    result = 0
    for interval in intervals:
        if previous is not None and interval.start < previous:
            raise ValueError("Active intervals must be ordered and cannot overlap")
        previous = interval.end
        result += interval.micros
    return result


def elapsed_micros(
    intervals: list[ActiveInterval], since: datetime | None, now: datetime
) -> int:
    total = total_micros(intervals)
    if since is not None:
        total += ActiveInterval(since, now).micros
    return total


def overlaps(left: list[ActiveInterval], right: list[ActiveInterval]) -> bool:
    return any(a.start < b.end and b.start < a.end for a in left for b in right)


def validate_saved(intervals: list[ActiveInterval], now: datetime) -> int:
    seconds = total_micros(intervals) // 1000000
    if not 1 <= seconds <= MAX_SECONDS:
        raise ValueError("Save between one second and 24 hours of active practice")
    if any(i.end > aware(now) for i in intervals):
        raise ValueError("Practice cannot be recorded in the future")
    return seconds


def routine_position(seconds: float, durations: list[int]) -> tuple[int, float]:
    remaining = max(0.0, seconds)
    for index, duration in enumerate(durations):
        if remaining < duration:
            return index, duration - remaining
        remaining -= duration
    return len(durations), 0
