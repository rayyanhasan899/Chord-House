from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.catalog.song_domain import chord_valid
from app.modules.practice.domain import aware

Instrument = Literal["acoustic_guitar", "electric_guitar", "bass", "ukulele"]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SessionDetails(Input):
    instrument: Instrument
    focus: str = Field(default="", max_length=200)
    notes: str = Field(default="", max_length=2000)
    song_id: UUID | None = None
    chord_id: UUID | None = None
    chord_name: str = Field(default="", max_length=15)

    @model_validator(mode="after")
    def chord(self) -> SessionDetails:
        if self.chord_name and not chord_valid(self.chord_name):
            raise ValueError("Use a supported chord symbol")
        return self


class SessionStart(SessionDetails):
    client_key: UUID
    routine_id: UUID | None = None
    target_seconds: int | None = Field(default=None, ge=1, le=86400, strict=True)


class Command(Input):
    version: int = Field(ge=1, strict=True)
    confirm_long: bool = False


class SessionUpdate(SessionDetails):
    version: int = Field(ge=1, strict=True)
    confirm_long: bool = False
    corrected_start: datetime | None = None
    corrected_seconds: int | None = Field(default=None, ge=1, le=86400, strict=True)

    @model_validator(mode="after")
    def correction(self) -> SessionUpdate:
        if (self.corrected_start is None) != (self.corrected_seconds is None):
            raise ValueError("A correction needs both start time and duration")
        if self.corrected_start:
            aware(self.corrected_start)
        return self


class IntervalView(BaseModel):
    start: datetime
    end: datetime


class SessionView(SessionDetails):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    state: Literal["active", "paused", "ended", "saved"]
    started_at: datetime
    ended_at: datetime | None
    running_since: datetime | None
    intervals: list[IntervalView]
    duration_seconds: int
    target_seconds: int | None
    timezone: str
    version: int
    routine_id: UUID | None
    routine_snapshot: RoutineView | None
    as_of: datetime


class ActivityInput(Input):
    name: str = Field(min_length=1, max_length=120)
    duration_seconds: int = Field(ge=1, le=14400, strict=True)
    tool: Literal["none", "metronome", "chords", "pattern", "song", "tuner"] = "none"
    bpm: int = Field(default=100, ge=30, le=300, strict=True)
    song_id: UUID | None = None
    chord_id: UUID | None = None
    pattern_id: UUID | None = None
    chord_name: str = Field(default="", max_length=15)

    @model_validator(mode="after")
    def required(self) -> ActivityInput:
        if not self.name.strip() or (
            self.chord_name and not chord_valid(self.chord_name)
        ):
            raise ValueError("Use a name and a valid chord symbol")
        if self.tool == "song" and self.song_id is None:
            raise ValueError("Choose a song for a song activity")
        if self.tool == "pattern" and self.pattern_id is None:
            raise ValueError("Choose a pattern for a pattern activity")
        return self


class RoutineInput(Input):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)
    instrument: Instrument
    activities: list[ActivityInput] = Field(min_length=1, max_length=30)

    @model_validator(mode="after")
    def duration(self) -> RoutineInput:
        if (
            not self.name.strip()
            or sum(a.duration_seconds for a in self.activities) > 86400
        ):
            raise ValueError("Use a name and at most 24 hours per routine")
        return self


class RoutineCreate(RoutineInput):
    client_key: UUID


class RoutineUpdate(RoutineInput):
    version: int = Field(ge=1, strict=True)


class RoutineView(RoutineInput):
    id: UUID
    version: int
    warnings: list[str] = Field(default_factory=list)


class Duplicate(Input):
    client_key: UUID


class GoalInput(Input):
    minutes: int = Field(ge=1, le=10080, strict=True)
    paused: bool = False
    version: int = Field(default=0, ge=0, strict=True)


class GoalView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    period: Literal["daily", "weekly"]
    minutes: int
    paused: bool
    version: int
    effective_from: datetime


SessionView.model_rebuild()
