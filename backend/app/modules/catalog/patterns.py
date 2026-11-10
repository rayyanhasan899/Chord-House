from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
    or_,
    select,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, Database
from app.modules.catalog.pattern_domain import Rhythm, publication_allowed
from app.modules.catalog.song_domain import publishable
from app.modules.catalog.song_schemas import Grant
from app.modules.identity.domain import Actor, IdentityError


class PatternRecord(Base):
    __tablename__ = "strumming_patterns"
    __table_args__ = (
        CheckConstraint(
            "(owner_id IS NOT NULL AND status = 'private') OR "
            "(owner_id IS NULL AND status IN ('draft','published','archived'))",
            name="visibility",
        ),
        CheckConstraint("subdivision IN (1,2,4)", name="subdivision"),
        CheckConstraint(
            "tempo_min >= 30 AND tempo_max <= 300 AND tempo_min <= tempo_max",
            name="tempo",
        ),
        CheckConstraint("meter IN ('2/4','3/4','4/4','6/8')", name="meter"),
        CheckConstraint(
            "difficulty IN ('beginner','intermediate','advanced')", name="difficulty"
        ),
        CheckConstraint("length(trim(name)) > 0", name="name"),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True)
    owner_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(12), index=True)
    name: Mapped[str] = mapped_column(String(80))
    meter: Mapped[str] = mapped_column(String(4))
    subdivision: Mapped[int]
    strokes: Mapped[list[str]] = mapped_column(JSONB)
    tempo_min: Mapped[int]
    tempo_max: Mapped[int]
    difficulty: Mapped[str] = mapped_column(String(16))
    style: Mapped[str] = mapped_column(String(40))
    description: Mapped[str] = mapped_column(Text)
    rights_statement: Mapped[str] = mapped_column(Text, default="")
    attribution: Mapped[str] = mapped_column(String(200), default="")
    reviewed: Mapped[bool] = mapped_column(default=False)
    grant: Mapped[dict[str, object] | None] = mapped_column(JSONB, nullable=True)
    revision: Mapped[int] = mapped_column(default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    actor_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL")
    )


class PatternFavorite(Base):
    __tablename__ = "pattern_favorites"
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True
    )
    pattern_id: Mapped[UUID] = mapped_column(
        ForeignKey("strumming_patterns.id", ondelete="CASCADE"), primary_key=True
    )


class PatternInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=80)
    meter: Literal["2/4", "3/4", "4/4", "6/8"]
    subdivision: int = Field(strict=True)
    strokes: list[Literal["D", "U", "R", "X"]] = Field(max_length=24)
    tempo_min: int = Field(default=60, strict=True)
    tempo_max: int = Field(default=140, strict=True)
    difficulty: Literal["beginner", "intermediate", "advanced"] = "beginner"
    style: str = Field(default="General", min_length=1, max_length=40)
    description: str = Field(default="", max_length=2000)

    @model_validator(mode="after")
    def valid_rhythm(self) -> PatternInput:
        if not self.name.strip() or not self.style.strip():
            raise ValueError("Name and style are required")
        Rhythm(
            self.meter,
            self.subdivision,
            tuple(self.strokes),
            self.tempo_min,
            self.tempo_max,
        )
        return self


class SharedPatternInput(PatternInput):
    status: Literal["draft", "published", "archived"] = "draft"
    reviewed: bool = False
    rights_statement: str = Field(default="", max_length=2000)
    attribution: str = Field(default="", max_length=200)
    grant: Grant | None = None

    @model_validator(mode="after")
    def publishable(self) -> SharedPatternInput:
        if self.status == "published":
            publication_allowed(self.reviewed, self.rights_statement, self.attribution)
            if self.grant is None or not grant_current(self.grant):
                raise ValueError("Pattern rights are expired or unreviewed")
        return self


class PatternView(PatternInput):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    status: str
    favorite: bool = False
    attribution: str
    rights_statement: str
    reviewed: bool


def grant_current(grant: Grant) -> bool:
    return publishable(
        grant.reviewed,
        grant.display,
        grant.cache,
        grant.territories,
        grant.evidence,
        grant.expires_at,
        datetime.now(UTC),
    )


def pattern_available(row: PatternRecord) -> bool:
    return row.status == "published" and (
        row.grant is None or grant_current(Grant.model_validate(row.grant))
    )


class Patterns:
    def __init__(self, db: Database):
        self.db = db

    @staticmethod
    def manager(actor: Actor) -> None:
        if actor.role not in ("admin", "content_manager"):
            raise IdentityError(403, "forbidden", "Content manager access required")

    def list(
        self, actor: Actor, offset: int, limit: int, managed: bool = False
    ) -> list[PatternView]:
        if managed:
            self.manager(actor)
        with self.db.transaction() as session:
            favorites = set(
                session.scalars(
                    select(PatternFavorite.pattern_id).where(
                        PatternFavorite.owner_id == actor.id
                    )
                )
            )
            scope = (
                PatternRecord.owner_id.is_(None)
                if managed
                else or_(
                    PatternRecord.status == "published",
                    PatternRecord.owner_id == actor.id,
                )
            )
            rows = session.scalars(
                select(PatternRecord)
                .where(scope)
                .order_by(PatternRecord.name, PatternRecord.id)
            )
            return [
                PatternView.model_validate(row).model_copy(
                    update={"favorite": row.id in favorites}
                )
                for row in rows
                if managed or row.owner_id == actor.id or pattern_available(row)
            ][offset : offset + limit]

    def save(
        self,
        actor: Actor,
        data: PatternInput,
        identifier: UUID | None = None,
        shared: bool = False,
    ) -> PatternView:
        if shared:
            self.manager(actor)
        with self.db.transaction() as session:
            scope = (
                PatternRecord.owner_id.is_(None)
                if shared
                else PatternRecord.owner_id == actor.id
            )
            row = (
                session.scalar(
                    select(PatternRecord).where(PatternRecord.id == identifier, scope)
                )
                if identifier
                else PatternRecord(
                    id=uuid4(),
                    owner_id=None if shared else actor.id,
                    status="draft" if shared else "private",
                )
            )
            if row is None:
                raise IdentityError(404, "not_found", "Pattern not found")
            for key, value in data.model_dump(mode="json").items():
                setattr(row, key, value)
            if shared:
                from app.modules.content_management.models import audit

                row.updated_at = datetime.now(UTC)
                row.actor_id = actor.id
                row.revision = (row.revision or 0) + 1
                audit(session, actor.id, "pattern", str(row.id), "save:" + row.status)
            session.add(row)
            session.flush()
            return PatternView.model_validate(row)

    def remove(self, actor: Actor, identifier: UUID, shared: bool = False) -> None:
        if shared:
            self.manager(actor)
        with self.db.transaction() as session:
            scope = (
                PatternRecord.owner_id.is_(None)
                if shared
                else PatternRecord.owner_id == actor.id
            )
            row = session.scalar(
                select(PatternRecord).where(PatternRecord.id == identifier, scope)
            )
            if row is None:
                raise IdentityError(404, "not_found", "Pattern not found")
            if shared:
                row.status = "archived"
                from app.modules.content_management.models import audit

                row.updated_at = datetime.now(UTC)
                row.actor_id = actor.id
                row.revision += 1
                audit(session, actor.id, "pattern", str(row.id), "archive")
            else:
                session.delete(row)

    def favorite(self, actor: Actor, identifier: UUID, enabled: bool) -> None:
        from sqlalchemy.dialects.postgresql import insert

        with self.db.transaction() as session:
            row = session.scalar(
                select(PatternRecord)
                .where(
                    PatternRecord.id == identifier,
                    or_(
                        PatternRecord.status == "published",
                        PatternRecord.owner_id == actor.id,
                    ),
                )
                .with_for_update()
            )
            if row is None:
                raise IdentityError(404, "not_found", "Pattern not found")
            if row.owner_id is None and not pattern_available(row):
                raise IdentityError(404, "not_found", "Pattern not available")
            if enabled:
                session.execute(
                    insert(PatternFavorite)
                    .values(owner_id=actor.id, pattern_id=identifier)
                    .on_conflict_do_nothing()
                )
            else:
                record = session.get(PatternFavorite, (actor.id, identifier))
                if record:
                    session.delete(record)
