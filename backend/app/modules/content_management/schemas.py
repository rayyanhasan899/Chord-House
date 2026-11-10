import re
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.catalog.custom_chords import ChordInput
from app.modules.catalog.patterns import SharedPatternInput
from app.modules.catalog.song_schemas import Grant, SongInput
from app.modules.catalog.songs import approved

Kind = Literal["instrument", "tuning", "chord", "pattern", "song"]
State = Literal["draft", "published", "archived"]


class InstrumentInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=80)
    string_count: int = Field(strict=True, ge=1, le=12)
    grant: Grant


class TuningInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=80)
    instrument: str = Field(min_length=1, max_length=40)
    pitches: list[int] = Field(min_length=1, max_length=12)
    grant: Grant

    @model_validator(mode="after")
    def valid(self) -> TuningInput:
        if any(type(p) is not int or not 0 <= p <= 127 for p in self.pitches):
            raise ValueError("MIDI pitches must be integers from 0 to 127")
        return self


class PublicChordInput(ChordInput):
    quality: Literal["major", "minor", "7", "maj7", "m7", "sus2", "sus4"]
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"
    guidance: str = Field(default="", max_length=2000)
    grant: Grant

    @model_validator(mode="after")
    def chord_tones(self) -> PublicChordInput:
        match = re.fullmatch(r"([A-G])([#b]?)(.*)", self.name)
        suffixes = {
            "major": "",
            "minor": "m",
            "7": "7",
            "maj7": "maj7",
            "m7": "m7",
            "sus2": "sus2",
            "sus4": "sus4",
        }
        if not match or match[3] != suffixes[self.quality]:
            raise ValueError("Chord name must match its quality")
        root = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[match[1]]
        root += 1 if match[2] == "#" else -1 if match[2] == "b" else 0
        intervals = {
            "major": [0, 4, 7],
            "minor": [0, 3, 7],
            "7": [0, 4, 7, 10],
            "maj7": [0, 4, 7, 11],
            "m7": [0, 3, 7, 10],
            "sus2": [0, 2, 7],
            "sus4": [0, 5, 7],
        }
        pitches = {
            "guitar": [40, 45, 50, 55, 59, 64],
            "bass": [28, 33, 38, 43],
            "ukulele": [67, 60, 64, 69],
        }[self.instrument]
        actual = {
            (pitch + fret) % 12
            for pitch, fret in zip(pitches, self.frets, strict=True)
            if fret >= 0
        }
        if actual != {(root + step) % 12 for step in intervals[self.quality]}:
            raise ValueError("Voicing pitches must match the named chord")
        return self


class ContentWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=0, strict=True)
    status: State = "draft"
    document: dict[str, object]


class ContentView(ContentWrite):
    kind: Kind
    key: str
    created_at: datetime
    updated_at: datetime
    actor_id: UUID | None


class ReportInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Kind
    key: str = Field(min_length=1, max_length=150)
    message: str = Field(min_length=1, max_length=2000)


class ReportView(ReportInput):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    status: str
    revision: int
    created_at: datetime
    updated_at: datetime


class Resolution(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=1)
    status: Literal["open", "corrected", "dismissed"]


class AuditView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    actor_id: UUID | None
    kind: str
    key: str
    action: str
    created_at: datetime


def validate_document(kind: Kind, data: ContentWrite) -> dict[str, object]:
    models: dict[str, type[BaseModel]] = {
        "instrument": InstrumentInput,
        "tuning": TuningInput,
        "chord": PublicChordInput,
        "pattern": SharedPatternInput,
        "song": SongInput,
    }
    document = dict(data.document)
    if kind == "pattern":
        document["status"] = data.status
    parsed = models[kind].model_validate(document)
    if kind in ("instrument", "tuning") and not str(document.get("name", "")).strip():
        raise ValueError("A display name is required")
    grants: list[Grant] = []
    if isinstance(parsed, SongInput):
        grants = [
            parsed.metadata_grant,
            *[a.grant for a in parsed.arrangements],
            *[t.grant for t in parsed.texts],
        ]
    elif isinstance(parsed, SharedPatternInput):
        if data.status == "published" and parsed.grant is None:
            raise ValueError("Add component provenance before publishing")
        if parsed.grant:
            grants = [parsed.grant]
    else:
        grants = [Grant.model_validate(document.get("grant"))]
    if data.status == "published" and any(not approved(g) for g in grants):
        raise ValueError("Current reviewed worldwide display/cache rights are required")
    return parsed.model_dump(mode="json")
