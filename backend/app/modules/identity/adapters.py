import json
import secrets
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError

from app.core.config import Settings


class ArgonPasswords:
    def __init__(self) -> None:
        self.hasher = PasswordHasher()
        self.dummy = self.hasher.hash(secrets.token_urlsafe(32))

    def hash(self, password: str) -> str:
        return self.hasher.hash(password)

    def verify(self, encoded: str, password: str) -> bool:
        try:
            return self.hasher.verify(encoded, password)
        except VerificationError:
            return False


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
            path = folder / (secrets.token_hex(16) + ".json")
            with path.open("x", encoding="utf-8") as target:
                path.chmod(0o600)
                json.dump(
                    {"recipient": recipient, "purpose": purpose, "token": token}, target
                )
