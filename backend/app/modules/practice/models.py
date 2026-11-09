from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RoutineRecord(Base):
    __tablename__ = "practice_routines"
    __table_args__ = (
        UniqueConstraint("owner_id", "client_key"),
        CheckConstraint("version > 0", name="version"),
        CheckConstraint(
            "instrument IN ('acoustic_guitar','electric_guitar','bass','ukulele')",
            name="instrument",
        ),
        CheckConstraint("length(trim(name)) > 0", name="name"),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    client_key: Mapped[UUID]
    creation_hash: Mapped[str] = mapped_column(String(64))
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    instrument: Mapped[str] = mapped_column(String(24))
    version: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ActivityRecord(Base):
    __tablename__ = "practice_activities"
    __table_args__ = (
        UniqueConstraint("routine_id", "position"),
        CheckConstraint("duration_seconds BETWEEN 1 AND 14400", name="duration"),
        CheckConstraint("position BETWEEN 0 AND 29", name="position"),
        CheckConstraint("bpm BETWEEN 30 AND 300", name="bpm"),
        CheckConstraint(
            "tool IN ('none','metronome','chords','pattern','song','tuner')",
            name="tool",
        ),
        CheckConstraint("length(trim(name)) > 0", name="name"),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True)
    routine_id: Mapped[UUID] = mapped_column(
        ForeignKey("practice_routines.id", ondelete="CASCADE")
    )
    position: Mapped[int]
    requires_chord: Mapped[bool] = mapped_column(default=False)
    name: Mapped[str] = mapped_column(String(120))
    duration_seconds: Mapped[int]
    tool: Mapped[str] = mapped_column(String(20))
    bpm: Mapped[int]
    song_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("song_references.id", ondelete="SET NULL")
    )
    chord_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("custom_chords.id", ondelete="SET NULL")
    )
    pattern_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("strumming_patterns.id", ondelete="SET NULL")
    )
    chord_name: Mapped[str] = mapped_column(String(15))


class PracticeRecord(Base):
    __tablename__ = "practice_sessions"
    __table_args__ = (
        CheckConstraint("state IN ('active','paused','ended','saved')", name="state"),
        CheckConstraint("duration_seconds >= 0", name="duration"),
        CheckConstraint(
            "target_seconds IS NULL OR target_seconds BETWEEN 1 AND 86400",
            name="target",
        ),
        CheckConstraint(
            "(state='active') = (running_since IS NOT NULL)", name="running"
        ),
        CheckConstraint(
            "(state IN ('ended','saved')) = (ended_at IS NOT NULL)", name="ended"
        ),
        CheckConstraint("version > 0", name="version"),
        CheckConstraint(
            "instrument IN ('acoustic_guitar','electric_guitar','bass','ukulele')",
            name="instrument",
        ),
        CheckConstraint(
            "ended_at IS NULL OR ended_at >= started_at", name="timestamps"
        ),
        CheckConstraint(
            "state <> 'saved' OR duration_seconds BETWEEN 1 AND 86400",
            name="saved_duration",
        ),
        Index(
            "uq_practice_open_owner",
            "owner_id",
            unique=True,
            postgresql_where=text("state <> 'saved'"),
        ),
        Index("ix_practice_owner_started", "owner_id", "started_at"),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE")
    )
    state: Mapped[str] = mapped_column(String(10))
    instrument: Mapped[str] = mapped_column(String(24))
    focus: Mapped[str] = mapped_column(String(200))
    notes: Mapped[str] = mapped_column(Text)
    song_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("song_references.id", ondelete="SET NULL")
    )
    chord_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("custom_chords.id", ondelete="SET NULL")
    )
    chord_name: Mapped[str] = mapped_column(String(15))
    routine_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("practice_routines.id", ondelete="SET NULL")
    )
    routine_snapshot: Mapped[dict[str, object] | None] = mapped_column(
        JSONB, nullable=True
    )
    timezone: Mapped[str] = mapped_column(String(80))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    running_since: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    intervals: Mapped[list[dict[str, str]]] = mapped_column(JSONB)
    duration_seconds: Mapped[int]
    target_seconds: Mapped[int | None]
    version: Mapped[int]


class PracticeStartRecord(Base):
    """Retry keys survive deletion without retaining session payloads."""

    __tablename__ = "practice_start_keys"
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True
    )
    client_key: Mapped[UUID] = mapped_column(primary_key=True)
    session_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("practice_sessions.id", ondelete="SET NULL"), unique=True
    )
    creation_hash: Mapped[str] = mapped_column(String(64))


class GoalRecord(Base):
    __tablename__ = "practice_goals"
    __table_args__ = (
        UniqueConstraint("owner_id", "period", "version"),
        CheckConstraint("period IN ('daily','weekly')", name="period"),
        CheckConstraint(
            "minutes >= 1 AND ((period='daily' AND minutes <= 1440) OR "
            "(period='weekly' AND minutes <= 10080))",
            name="minutes",
        ),
        Index(
            "uq_practice_current_goal",
            "owner_id",
            "period",
            unique=True,
            postgresql_where=text("effective_to IS NULL"),
        ),
        CheckConstraint("version > 0", name="version"),
        CheckConstraint(
            "effective_to IS NULL OR effective_to >= effective_from", name="effective"
        ),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE")
    )
    period: Mapped[str] = mapped_column(String(8))
    minutes: Mapped[int]
    paused: Mapped[bool]
    version: Mapped[int]
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
