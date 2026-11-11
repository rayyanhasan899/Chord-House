import json
import secrets
import smtplib
import ssl
import time
from collections.abc import Iterator
from contextlib import contextmanager
from email.message import EmailMessage
from pathlib import Path
from threading import BoundedSemaphore

from argon2 import PasswordHasher
from argon2.exceptions import (
    HashingError,
    InvalidHashError,
    VerificationError,
    VerifyMismatchError,
)

from app.core.config import Settings
from app.modules.identity.domain import IdentityError

_password_slots = BoundedSemaphore(2)


@contextmanager
def password_slot() -> Iterator[None]:
    if not _password_slots.acquire(timeout=3):
        raise IdentityError(
            503, "auth_busy", "Account service is busy. Try again shortly."
        )
    try:
        yield
    finally:
        _password_slots.release()


class ArgonPasswords:
    def __init__(self) -> None:
        self.hasher = PasswordHasher()
        self.dummy = self.hash(secrets.token_urlsafe(32))

    def hash(self, password: str) -> str:
        with password_slot():
            try:
                return self.hasher.hash(password)
            except HashingError:
                raise IdentityError(
                    503, "auth_busy", "Account service is busy. Try again shortly."
                ) from None

    def verify(self, encoded: str, password: str) -> bool:
        with password_slot():
            try:
                return self.hasher.verify(encoded, password)
            except VerifyMismatchError, InvalidHashError:
                return False
            except VerificationError:
                raise IdentityError(
                    503, "auth_busy", "Account service is busy. Try again shortly."
                ) from None


class Delivery:
    def __init__(self, config: Settings) -> None:
        self.config = config

    def send(self, recipient: str, purpose: str, token: str) -> None:
        if self.config.smtp_host:
            mail = EmailMessage()
            mail["From"] = self.config.mail_from
            mail["To"] = recipient
            mail["Subject"] = "Chord House: " + purpose
            mail.set_content("Your single-use " + purpose + " code: " + token)
            with smtplib.SMTP(
                self.config.smtp_host, self.config.smtp_port, timeout=10
            ) as smtp:
                smtp.starttls(context=ssl.create_default_context())
                if self.config.smtp_user and self.config.smtp_password:
                    smtp.login(
                        self.config.smtp_user,
                        self.config.smtp_password.get_secret_value(),
                    )
                smtp.send_message(mail)
        else:
            folder = Path(self.config.mail_directory)
            folder.mkdir(parents=True, exist_ok=True, mode=0o700)
            self.purge_expired()
            path = folder / (secrets.token_hex(16) + ".json")
            with path.open("x", encoding="utf-8") as target:
                path.chmod(0o600)
                json.dump(
                    {"recipient": recipient, "purpose": purpose, "token": token}, target
                )

    def purge_expired(self) -> int:
        if self.config.smtp_host:
            return 0
        removed = 0
        for path in Path(self.config.mail_directory).glob("*.json"):
            if (
                not path.is_symlink()
                and path.is_file()
                and path.stat().st_mtime <= time.time() - 1800
            ):
                path.unlink()
                removed += 1
        return removed

    def forget(self, recipient: str) -> None:
        if self.config.smtp_host:
            return
        for path in Path(self.config.mail_directory).glob("*.json"):
            if path.is_symlink() or not path.is_file():
                continue
            try:
                captured = json.loads(path.read_text(encoding="utf-8"))
            except ValueError, UnicodeError:
                continue
            address = captured.get("recipient") if isinstance(captured, dict) else None
            if isinstance(address, str) and address.casefold() == recipient.casefold():
                path.unlink()
