from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.identity.models import (
    AccountRecord,
    RateRecord,
    SessionRecord,
    TokenRecord,
)


class IdentityRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def account(self, owner: UUID) -> AccountRecord | None:
        return self.session.get(AccountRecord, owner)

    def by_email(self, email: str) -> AccountRecord | None:
        return self.session.scalar(
            select(AccountRecord).where(AccountRecord.email == email)
        )

    def revoke(self, owner: UUID) -> None:
        self.session.execute(
            delete(SessionRecord).where(SessionRecord.owner_id == owner)
        )

    def issue_token(
        self, owner: UUID, purpose: str, digest: str, now: datetime
    ) -> None:
        self.session.execute(
            delete(TokenRecord).where(
                TokenRecord.owner_id == owner, TokenRecord.purpose == purpose
            )
        )
        self.session.add(
            TokenRecord(
                owner_id=owner,
                purpose=purpose,
                token_hash=digest,
                expires_at=now + timedelta(minutes=30),
            )
        )

    def consume_token(self, digest: str, purpose: str, now: datetime) -> UUID | None:
        return self.session.scalar(
            delete(TokenRecord)
            .where(
                TokenRecord.token_hash == digest,
                TokenRecord.purpose == purpose,
                TokenRecord.expires_at > now,
            )
            .returning(TokenRecord.owner_id)
        )

    def rate(self, key: str, now: datetime) -> int:
        self.session.execute(delete(RateRecord).where(RateRecord.expires_at <= now))
        stmt = insert(RateRecord).values(
            key=key, hits=1, expires_at=now + timedelta(minutes=15)
        )
        return int(
            self.session.scalar(
                stmt.on_conflict_do_update(
                    index_elements=[RateRecord.key], set_={"hits": RateRecord.hits + 1}
                ).returning(RateRecord.hits)
            )
            or 0
        )

    def create(
        self, owner: UUID, email: str, name: str, password_hash: str
    ) -> AccountRecord:
        row = AccountRecord(
            id=owner, email=email, display_name=name, password_hash=password_hash
        )
        self.session.add(row)
        self.session.flush()
        return row

    def new_session(self, owner: UUID, digest: str, csrf: str, now: datetime) -> None:
        self.session.add(
            SessionRecord(
                owner_id=owner,
                token_hash=digest,
                csrf_token=csrf,
                last_seen=now,
                expires_at=now + timedelta(days=7),
            )
        )

    def session_record(self, digest: str) -> SessionRecord | None:
        return self.session.get(SessionRecord, digest)

    def delete_session(self, digest: str) -> None:
        self.session.execute(
            delete(SessionRecord).where(SessionRecord.token_hash == digest)
        )

    def remove(self, owner: UUID) -> None:
        self.session.execute(delete(AccountRecord).where(AccountRecord.id == owner))
