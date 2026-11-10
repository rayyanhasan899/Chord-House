from datetime import date, datetime
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AssessmentRecord(Base):
    __tablename__ = "training_assessments"
    __table_args__ = (UniqueConstraint("owner_id", "client_key"),)
    id: Mapped[UUID] = mapped_column(primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    client_key: Mapped[UUID]
    fingerprint: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict[str, object] | None] = mapped_column(
        JSONB(none_as_null=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ReminderRecord(Base):
    __tablename__ = "practice_reminder_preferences"
    __table_args__ = (CheckConstraint("version > 0", name="version"),)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True
    )
    enabled: Mapped[bool]
    browser_notifications: Mapped[bool]
    local_time: Mapped[str] = mapped_column(String(5))
    weekdays: Mapped[list[int]] = mapped_column(JSONB)
    version: Mapped[int]


class ReminderDeliveryRecord(Base):
    __tablename__ = "practice_reminder_deliveries"
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True
    )
    local_day: Mapped[date] = mapped_column(Date, primary_key=True)
