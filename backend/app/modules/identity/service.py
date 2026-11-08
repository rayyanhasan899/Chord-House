import hashlib
import secrets
from datetime import UTC, datetime
from typing import Literal, cast
from uuid import uuid4

from sqlalchemy.exc import IntegrityError

from app.core.database import Database
from app.modules.identity.domain import (
    Actor,
    IdentityError,
    Mailer,
    Passwords,
    session_valid,
)
from app.modules.identity.repository import IdentityRepository
from app.modules.identity.schemas import Profile, ProfileUpdate, Registration


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


class IdentityService:
    def __init__(self, db: Database, passwords: Passwords, mailer: Mailer) -> None:
        self.db, self.passwords, self.mailer = db, passwords, mailer
        self.dummy = passwords.hash(secrets.token_urlsafe(32))

    def throttle(self, key: str, limit: int) -> None:
        with self.db.transaction() as session:
            hits = IdentityRepository(session).rate(digest(key), datetime.now(UTC))
        if hits > limit:
            raise IdentityError(429, "rate_limited", "Please wait before trying again")

    def register(self, data: Registration) -> None:
        if not data.acknowledge_privacy:
            raise IdentityError(
                422, "privacy_required", "Acknowledge the privacy notice"
            )
        token = secrets.token_urlsafe(32)
        try:
            with self.db.transaction() as session:
                repo = IdentityRepository(session)
                row = repo.create(
                    uuid4(),
                    str(data.email).casefold(),
                    data.display_name,
                    self.passwords.hash(data.password),
                )
                repo.issue_token(row.id, "verify", digest(token), datetime.now(UTC))
                self.mailer.send(str(data.email), "verify", token)
        except IntegrityError:
            raise IdentityError(
                409, "registration_failed", "Registration could not be completed"
            ) from None

    def login(self, email: str, password: str, previous: str | None) -> str:
        token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        with self.db.transaction() as session:
            repo = IdentityRepository(session)
            row = repo.by_email(email.casefold())
            encoded = row.password_hash if row and row.password_hash else self.dummy
            valid = self.passwords.verify(encoded, password)
            if not valid or row is None or row.password_hash is None:
                raise IdentityError(
                    401, "invalid_credentials", "Invalid email or password"
                )
            if previous:
                repo.delete_session(digest(previous))
            repo.new_session(row.id, digest(token), csrf, datetime.now(UTC))
        return token

    def actor(self, token: str | None) -> Actor:
        if not token or len(token) > 100:
            raise IdentityError(401, "authentication_required", "Please sign in")
        with self.db.transaction() as session:
            repo = IdentityRepository(session)
            stored = repo.session_record(digest(token))
            now = datetime.now(UTC)
            if stored is None or not session_valid(
                now, stored.last_seen, stored.expires_at
            ):
                raise IdentityError(401, "session_expired", "Please sign in again")
            row = repo.account(stored.owner_id)
            if row is None:
                raise IdentityError(401, "authentication_required", "Please sign in")
            stored.last_seen = now
            return Actor(
                row.id,
                cast(Literal["user", "content_manager", "admin"], row.role),
                row.email_verified,
                stored.csrf_token,
                stored.token_hash,
            )

    def profile(self, actor: Actor) -> Profile:
        with self.db.transaction() as session:
            row = IdentityRepository(session).account(actor.id)
            if row is None:
                raise IdentityError(401, "authentication_required", "Please sign in")
            return Profile.model_validate(
                {
                    name: getattr(row, name)
                    for name in (
                        "email",
                        "display_name",
                        "instrument",
                        "skill",
                        "timezone",
                        "theme",
                        "handedness",
                        "chord_display",
                        "tuning",
                        "interests",
                        "onboarding_complete",
                        "email_verified",
                        "role",
                    )
                }
                | {"id": str(row.id), "csrf_token": actor.csrf}
            )

    def update(self, actor: Actor, data: ProfileUpdate) -> Profile:
        allowed = {
            "acoustic_guitar": ("standard", "drop_d", "dadgad"),
            "electric_guitar": ("standard", "drop_d", "dadgad"),
            "bass": ("standard",),
            "ukulele": ("reentrant",),
        }
        if data.tuning not in allowed[data.instrument]:
            raise IdentityError(
                422, "invalid_tuning", "Choose a tuning for the selected instrument"
            )
        with self.db.transaction() as session:
            row = IdentityRepository(session).account(actor.id)
            if row is None:
                raise IdentityError(401, "authentication_required", "Please sign in")
            for name, value in data.model_dump().items():
                setattr(row, name, value)
        return self.profile(actor)

    def logout(self, actor: Actor) -> None:
        with self.db.transaction() as session:
            IdentityRepository(session).delete_session(actor.session_hash)

    def change_password(self, actor: Actor, old: str, new: str) -> None:
        with self.db.transaction() as session:
            repo = IdentityRepository(session)
            row = repo.account(actor.id)
            if (
                row is None
                or row.password_hash is None
                or not self.passwords.verify(row.password_hash, old)
            ):
                raise IdentityError(
                    403, "verification_failed", "Current password is incorrect"
                )
            row.password_hash = self.passwords.hash(new)
            repo.revoke(actor.id)

    def request_token(self, email: str, purpose: str) -> None:
        with self.db.transaction() as session:
            repo = IdentityRepository(session)
            row = repo.by_email(email.casefold())
            if row is not None and (purpose != "verify" or not row.email_verified):
                token = secrets.token_urlsafe(32)
                repo.issue_token(row.id, purpose, digest(token), datetime.now(UTC))
                self.mailer.send(email, purpose, token)

    def consume(self, token: str, purpose: str, password: str | None = None) -> None:
        with self.db.transaction() as session:
            repo = IdentityRepository(session)
            owner = repo.consume_token(digest(token), purpose, datetime.now(UTC))
            if owner is None:
                raise IdentityError(400, "invalid_token", "Code is invalid or expired")
            row = repo.account(owner)
            if row is None:
                raise IdentityError(400, "invalid_token", "Code is invalid or expired")
            if purpose == "verify":
                row.email_verified = True
            elif password is not None:
                row.password_hash = self.passwords.hash(password)
                repo.revoke(owner)

    def delete_account(self, actor: Actor, password: str, confirm: bool) -> None:
        with self.db.transaction() as session:
            repo = IdentityRepository(session)
            row = repo.account(actor.id)
            if (
                not confirm
                or row is None
                or not row.email_verified
                or not row.password_hash
                or not self.passwords.verify(row.password_hash, password)
            ):
                raise IdentityError(
                    403,
                    "verification_failed",
                    "Verify your email, password and deletion confirmation",
                )
            repo.remove(actor.id)
