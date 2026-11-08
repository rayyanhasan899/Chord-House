from datetime import datetime
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import DateTime, ForeignKey, String, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, Database
from app.modules.catalog.domain import validate_chord
from app.modules.identity.domain import IdentityError


class CustomChordRecord(Base):
    __tablename__ = "custom_chords"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(80))
    instrument: Mapped[str] = mapped_column(String(20))
    frets: Mapped[list[int]] = mapped_column(JSONB)
    fingers: Mapped[list[int]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ChordInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=80)
    instrument: Literal["guitar", "bass", "ukulele"]
    frets: list[int] = Field(min_length=4, max_length=6)
    fingers: list[int] = Field(min_length=4, max_length=6)

    @model_validator(mode="after")
    def playable(self) -> ChordInput:
        validate_chord(self.name, self.instrument, self.frets, self.fingers)
        return self


class ChordView(ChordInput):
    model_config = ConfigDict(from_attributes=True)
    id: UUID


class CustomChords:
    def __init__(self, db: Database) -> None:
        self.db = db

    def list(self, owner: UUID, offset: int = 0, limit: int = 100) -> list[ChordView]:
        with self.db.transaction() as session:
            return [
                ChordView.model_validate(row)
                for row in session.scalars(
                    select(CustomChordRecord)
                    .where(CustomChordRecord.owner_id == owner)
                    .order_by(CustomChordRecord.created_at, CustomChordRecord.id)
                    .offset(offset)
                    .limit(limit)
                )
            ]

    def save(
        self, owner: UUID, data: ChordInput, identifier: UUID | None = None
    ) -> ChordView:
        with self.db.transaction() as session:
            row = (
                session.scalar(
                    select(CustomChordRecord).where(
                        CustomChordRecord.owner_id == owner,
                        CustomChordRecord.id == identifier,
                    )
                )
                if identifier
                else CustomChordRecord(id=uuid4(), owner_id=owner)
            )
            if row is None:
                raise IdentityError(404, "not_found", "Chord not found")
            for key, value in data.model_dump().items():
                setattr(row, key, value)
            session.add(row)
            session.flush()
            return ChordView.model_validate(row)

    def remove(self, owner: UUID, identifier: UUID) -> None:
        with self.db.transaction() as session:
            row = session.scalar(
                select(CustomChordRecord).where(
                    CustomChordRecord.owner_id == owner,
                    CustomChordRecord.id == identifier,
                )
            )
            if row is None:
                raise IdentityError(404, "not_found", "Chord not found")
            session.delete(row)
