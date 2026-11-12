from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.catalog.song_domain import chord_valid, safe_url


class Grant(BaseModel):
    model_config = ConfigDict(extra="forbid")
    origin: Literal["application", "user_submission", "third_party"]
    license: str = Field(min_length=1, max_length=100)
    source_url: str = Field(max_length=500)
    attribution: str = Field(min_length=1, max_length=300)
    evidence: str = Field(min_length=1, max_length=2000)
    terms_version: str = Field(min_length=1, max_length=100)
    reviewer: str = Field(min_length=1, max_length=100)
    reviewed: bool = False
    display: bool = False
    cache: bool = False
    transpose: bool = False
    territories: list[str] = Field(default_factory=list, max_length=100)
    expires_at: datetime | None = None

    @model_validator(mode="after")
    def valid_source(self) -> Grant:
        if any(
            not s.strip()
            for s in (self.license, self.attribution, self.terms_version, self.reviewer)
        ):
            raise ValueError("License, attribution, terms and reviewer must be named")
        if not safe_url(self.source_url) or (
            self.expires_at is not None and self.expires_at.tzinfo is None
        ):
            raise ValueError("Use an HTTPS source and timezone-aware expiry")
        return self


class ChordPlacement(BaseModel):
    model_config = ConfigDict(extra="forbid")
    line: int = Field(ge=0, le=10000)
    offset: int = Field(ge=0, le=10000)
    chord: str = Field(max_length=15)

    @model_validator(mode="after")
    def valid_chord(self) -> ChordPlacement:
        if not chord_valid(self.chord):
            raise ValueError("Unsupported chord notation")
        return self


class ArrangementInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    key: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    instrument: Literal["guitar", "bass", "ukulele"]
    tuning: Literal["standard", "drop_d", "dadgad", "reentrant"] = "standard"
    difficulty: Literal["beginner", "intermediate", "advanced"]
    capo: int | None = Field(default=None, ge=0, le=12)
    key_note: str | None = Field(default=None, pattern=r"^[A-G][#b]?$")
    chords: list[str] = Field(min_length=1, max_length=100)
    placements: list[ChordPlacement] = Field(default_factory=list, max_length=1000)
    text_key: str | None = Field(default=None, max_length=80)
    pattern_id: UUID | None = None
    guidance: str = Field(default="", max_length=2000)
    grant: Grant

    @model_validator(mode="after")
    def valid_arrangement(self) -> ArrangementInput:
        if any(not chord_valid(c) for c in self.chords):
            raise ValueError("Unsupported chord notation")
        if (
            (self.instrument == "guitar" and self.tuning == "reentrant")
            or (self.instrument == "bass" and self.tuning != "standard")
            or (self.instrument == "ukulele" and self.tuning != "reentrant")
        ):
            raise ValueError("Tuning does not match instrument")
        if any(p.chord not in self.chords for p in self.placements):
            raise ValueError("Placement chord must occur in arrangement")
        return self


class TextInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    key: str = Field(min_length=1, max_length=80)
    language: Literal["en", "ur", "hi"]
    script: Literal["Latn", "Arab", "Deva"]
    label: str = Field(min_length=1, max_length=120)
    lines: list[str] = Field(min_length=1, max_length=1000)
    grant: Grant

    @model_validator(mode="after")
    def bounded_text(self) -> TextInput:
        if sum(map(len, self.lines)) > 100000 or any(
            len(line) > 2000 for line in self.lines
        ):
            raise ValueError("Text exceeds content limits")
        return self


class SongInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    external_key: str = Field(min_length=1, max_length=150)
    title: str = Field(min_length=1, max_length=200)
    artist: str = Field(min_length=1, max_length=200)
    language: Literal["en", "ur", "hi"]
    aliases: list[str] = Field(default_factory=list, max_length=30)
    genre: str | None = Field(default=None, max_length=60)
    version_note: str = Field(default="", max_length=500)
    metadata_grant: Grant
    arrangements: list[ArrangementInput] = Field(default_factory=list, max_length=20)
    texts: list[TextInput] = Field(default_factory=list, max_length=20)
    lyrics_url: str | None = Field(default=None, max_length=500)
    lyrics_link_verified: bool = False

    @model_validator(mode="after")
    def valid_song(self) -> SongInput:
        if (
            not self.title.strip()
            or not self.artist.strip()
            or any(len(a) > 200 for a in self.aliases)
        ):
            raise ValueError("Song identity is required and aliases must be bounded")
        if self.lyrics_url and not safe_url(self.lyrics_url):
            raise ValueError("Lyrics link must be HTTPS")
        if len({a.key for a in self.arrangements}) != len(self.arrangements) or len(
            {t.key for t in self.texts}
        ) != len(self.texts):
            raise ValueError("Duplicate component keys")
        texts = {t.key: t for t in self.texts}
        for arrangement in self.arrangements:
            positions = [(p.line, p.offset) for p in arrangement.placements]
            if positions != sorted(set(positions)):
                raise ValueError("Chord placements must be unique and in text order")
            if arrangement.placements and arrangement.text_key not in texts:
                raise ValueError("Placements need a matching text variant")
            if arrangement.text_key:
                if arrangement.text_key not in texts:
                    raise ValueError("Text variant not found")
                lines = texts[arrangement.text_key].lines
                if any(
                    p.line >= len(lines) or p.offset > len(lines[p.line])
                    for p in arrangement.placements
                ):
                    raise ValueError("Chord placement outside text")
        return self


class ImportInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    key: str = Field(min_length=1, max_length=100)
    replace_existing: bool = False
    items: list[SongInput] = Field(min_length=1, max_length=200)


class ImportView(BaseModel):
    id: UUID
    key: str
    state: str
    count: int
    issues: list[str]


class SongSummary(BaseModel):
    id: UUID
    title: str
    artist: str
    language: str
    aliases: list[str]
    genre: str | None
    version_note: str = ""
    audio_available: bool = False
    local_lyrics_available: bool = False
    arrangement_count: int
    text_count: int


class ListingArrangement(BaseModel):
    """Read projection; full arrangement validation remains at every write boundary."""

    key: str
    instrument: str
    difficulty: str
    grant: Grant


class ListingText(BaseModel):
    key: str
    grant: Grant


class ListingDocument(BaseModel):
    title: str
    artist: str
    language: str
    aliases: list[str]
    genre: str | None
    version_note: str = ""
    metadata_grant: Grant
    arrangements: list[ListingArrangement]
    texts: list[ListingText]


class SongPage(BaseModel):
    items: list[SongSummary]
    total: int
    offset: int
    limit: int


class SongDetail(SongSummary):
    metadata_grant: Grant
    arrangements: list[ArrangementInput]
    texts: list[TextInput]
    lyrics_url: str | None
    revision: int


class Withdrawal(BaseModel):
    model_config = ConfigDict(extra="forbid")
    component: Literal["metadata", "arrangement", "text"]
    key: str | None = None
