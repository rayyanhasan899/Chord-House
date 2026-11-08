from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class InstrumentRecord(Base):
    __tablename__ = "instruments"
    __table_args__ = (
        CheckConstraint("string_count BETWEEN 1 AND 12", name="string_count"),
    )
    code: Mapped[str] = mapped_column(String(40), primary_key=True)
    string_count: Mapped[int]


class TuningRecord(Base):
    __tablename__ = "tuning_presets"
    code: Mapped[str] = mapped_column(String(80), primary_key=True)
    instrument_code: Mapped[str] = mapped_column(
        ForeignKey("instruments.code", ondelete="RESTRICT"), index=True
    )
    archived: Mapped[bool] = mapped_column(server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class TuningStringRecord(Base):
    __tablename__ = "tuning_strings"
    __table_args__ = (
        CheckConstraint("position BETWEEN 1 AND 12", name="position"),
        CheckConstraint("midi_pitch BETWEEN 0 AND 127", name="pitch"),
    )
    tuning_code: Mapped[str] = mapped_column(
        ForeignKey("tuning_presets.code", ondelete="CASCADE"), primary_key=True
    )
    position: Mapped[int] = mapped_column(primary_key=True)
    midi_pitch: Mapped[int]
