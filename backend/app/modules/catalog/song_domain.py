"""Pure search, chord and publication policy."""

import re
import unicodedata
from datetime import datetime
from urllib.parse import urlparse


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).casefold()
    return " ".join("".join(c for c in value if not unicodedata.combining(c)).split())


def safe_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.hostname) and not parsed.username


def chord_valid(value: str) -> bool:
    return bool(
        re.fullmatch(
            r"[A-G](?:#|b)?(?:m|maj7|m7|7|dim|aug|sus2|sus4)?(?:/[A-G](?:#|b)?)?", value
        )
    )


def publishable(
    reviewed: bool,
    display: bool,
    cache: bool,
    territories: list[str],
    evidence: str,
    expires: datetime | None,
    now: datetime,
) -> bool:
    return (
        reviewed
        and display
        and cache
        and "*" in territories
        and len(evidence.strip()) >= 12
        and (expires is None or expires > now)
    )
