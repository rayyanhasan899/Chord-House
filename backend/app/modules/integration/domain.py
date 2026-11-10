from datetime import datetime
from zoneinfo import ZoneInfo


def reminder_due(
    now: datetime,
    timezone: str,
    local_time: str,
    weekdays: list[int],
    delivered_on: object,
) -> bool:
    local = now.astimezone(ZoneInfo(timezone))
    hour, minute = map(int, local_time.split(":"))
    since = local.hour * 60 + local.minute - (hour * 60 + minute)
    return (
        local.weekday() in weekdays and 0 <= since < 10 and delivered_on != local.date()
    )
