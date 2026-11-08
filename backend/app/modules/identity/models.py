from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AccountRecord(Base):
    """Identity account record; user-editable fields are explicitly allowlisted."""

    __tablename__ = "accounts"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    email: Mapped[str | None] = mapped_column(String(320), unique=True)
    password_hash: Mapped[str | None] = mapped_column(String(512))
    display_name: Mapped[str] = mapped_column(String(80), server_default="Learner")
    role: Mapped[str] = mapped_column(String(30), server_default="user")
    email_verified: Mapped[bool] = mapped_column(server_default="false")
    instrument: Mapped[str] = mapped_column(
        String(40), server_default="acoustic_guitar"
    )
    skill: Mapped[str] = mapped_column(String(20), server_default="beginner")
    timezone: Mapped[str] = mapped_column(String(100), server_default="UTC")
    theme: Mapped[str] = mapped_column(String(10), server_default="system")
    handedness: Mapped[str] = mapped_column(String(10), server_default="right")
    tuning: Mapped[str] = mapped_column(String(40), server_default="standard")
    chord_display: Mapped[str] = mapped_column(String(20), server_default="diagrams")
    interests: Mapped[str] = mapped_column(String(500), server_default="")
    onboarding_complete: Mapped[bool] = mapped_column(server_default="false")
    __table_args__ = (
        CheckConstraint("role IN ('user','content_manager','admin')", name="role"),
    )


class SessionRecord(Base):
    __tablename__ = "identity_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    csrf_token: Mapped[str] = mapped_column(String(64))
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class TokenRecord(Base):
    __tablename__ = "identity_tokens"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    purpose: Mapped[str] = mapped_column(String(10))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    __table_args__ = (CheckConstraint("purpose IN ('verify','reset')", name="purpose"),)


class RateRecord(Base):
    __tablename__ = "identity_rates"
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    hits: Mapped[int]
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
