from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.core.database import Base


class ReferenceContent(Base):
    __tablename__ = "managed_references"
    __table_args__ = (
        CheckConstraint("kind IN ('instrument','tuning','chord')", name="kind"),
        CheckConstraint("status IN ('draft','published','archived')", name="status"),
        CheckConstraint("revision > 0", name="revision"),
    )
    kind: Mapped[str] = mapped_column(String(16), primary_key=True)
    key: Mapped[str] = mapped_column(String(150), primary_key=True)
    status: Mapped[str] = mapped_column(String(16), index=True)
    document: Mapped[dict[str, object]] = mapped_column(JSONB)
    revision: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    actor_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL")
    )


class ContentReport(Base):
    __tablename__ = "content_reports"
    __table_args__ = (
        CheckConstraint("status IN ('open','corrected','dismissed')", name="status"),
        CheckConstraint(
            "kind IN ('instrument','tuning','chord','pattern','song')", name="kind"
        ),
        CheckConstraint("length(trim(message)) > 0", name="message"),
        CheckConstraint("revision > 0", name="revision"),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(16))
    key: Mapped[str] = mapped_column(String(150))
    message: Mapped[str] = mapped_column(String(2000))
    status: Mapped[str] = mapped_column(String(16), index=True, default="open")
    revision: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ContentAudit(Base):
    __tablename__ = "content_audit"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    actor_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL")
    )
    kind: Mapped[str] = mapped_column(String(16))
    key: Mapped[str] = mapped_column(String(150))
    action: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


def audit(
    session: Session, actor_id: UUID | None, kind: str, key: str, action: str
) -> None:
    # No arbitrary payload, email, report body, credentials or grant evidence.
    session.add(
        ContentAudit(id=uuid4(), actor_id=actor_id, kind=kind, key=key, action=action)
    )
