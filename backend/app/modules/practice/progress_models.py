from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MilestoneRecord(Base):
    __tablename__ = "roadmap_completions"
    __table_args__ = (
        CheckConstraint(
            "instrument IN ('acoustic_guitar','electric_guitar','bass','ukulele')",
            name="instrument",
        ),
    )
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True
    )
    instrument: Mapped[str] = mapped_column(String(24), primary_key=True)
    milestone: Mapped[str] = mapped_column(String(40), primary_key=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ReviewRecord(Base):
    __tablename__ = "practice_weekly_reviews"
    __table_args__ = (CheckConstraint("version > 0", name="version"),)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True
    )
    week: Mapped[str] = mapped_column(String(10), primary_key=True)
    improvement: Mapped[str] = mapped_column(String(2000))
    version: Mapped[int]
