from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Protocol
from uuid import UUID


class IdentityError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        self.status, self.code, self.message = status, code, message


@dataclass(frozen=True)
class Actor:
    id: UUID
    role: Literal["user", "content_manager", "admin"]
    verified: bool
    csrf: str
    session_hash: str


def session_valid(now: datetime, last_seen: datetime, expires: datetime) -> bool:
    return now < expires and 0 <= (now - last_seen).total_seconds() < 86400


class Mailer(Protocol):
    def send(self, recipient: str, purpose: str, token: str) -> None: ...


class Passwords(Protocol):
    def hash(self, password: str) -> str: ...
    def verify(self, encoded: str, password: str) -> bool: ...
