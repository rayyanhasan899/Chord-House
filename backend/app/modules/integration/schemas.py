from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictInt, model_validator

from app.modules.catalog.song_domain import chord_valid
from app.modules.practice.schemas import Instrument, RoutineInput


class AssessmentInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    client_key: UUID
    instrument: Instrument
    kind: Literal["transition", "challenge"]
    chords: list[str] = Field(min_length=2, max_length=8)
    seconds: int = Field(ge=1, le=3600, strict=True)
    changes: int = Field(ge=0, le=10000, strict=True)
    difficulty: Literal["easy", "steady", "hard"]
    completed: bool
    notes: str = Field(default="", max_length=1000)

    @model_validator(mode="after")
    def valid_chords(self) -> AssessmentInput:
        if len(set(self.chords)) < 2 or any(not chord_valid(c) for c in self.chords):
            raise ValueError("Choose supported chord symbols")
        return self


class AssessmentView(AssessmentInput):
    id: UUID
    created_at: datetime


class ReminderInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enabled: bool
    browser_notifications: bool = False
    local_time: str = Field(pattern=r"^(?:[01][0-9]|2[0-3]):[0-5][0-9]$")
    weekdays: list[StrictInt] = Field(default_factory=list, max_length=7)
    version: int = Field(ge=0, strict=True)

    @model_validator(mode="after")
    def days(self) -> ReminderInput:
        if self.enabled and not self.weekdays:
            raise ValueError("Choose a weekday before enabling reminders")
        if any(type(d) is not int or not 0 <= d <= 6 for d in self.weekdays):
            raise ValueError("Use Monday=0 through Sunday=6")
        if len(set(self.weekdays)) != len(self.weekdays):
            raise ValueError("Choose each weekday once")
        return self


class ReminderView(ReminderInput):
    timezone: str


class ReminderDue(BaseModel):
    due: bool
    browser_notifications: bool = False


class Suggestion(RoutineInput):
    reason: str
