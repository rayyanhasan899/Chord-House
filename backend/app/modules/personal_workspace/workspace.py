from datetime import date, datetime
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    func,
    select,
)
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.core.database import Base


class SongReference(Base):
    """Minimal reviewed catalogue identity needed by private workspace links."""

    __tablename__ = "song_references"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    artist: Mapped[str] = mapped_column(String(200))
    language: Mapped[str] = mapped_column(String(10))
    reviewed: Mapped[bool] = mapped_column(server_default="false")


class WorkspaceRecord(Base):
    __tablename__ = "workspace_items"
    __table_args__ = (
        CheckConstraint("kind IN ('task','collection','note','favorite')", name="kind"),
        CheckConstraint("priority IN ('low','normal','high')", name="priority"),
        CheckConstraint("length(trim(title)) > 0", name="title"),
        Index("ix_workspace_owner_kind_created", "owner_id", "kind", "created_at"),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE")
    )
    kind: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(10))
    category: Mapped[str] = mapped_column(String(60))
    due: Mapped[date | None]
    completed: Mapped[bool]
    collection_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("workspace_items.id", ondelete="SET NULL")
    )
    song_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("song_references.id", ondelete="RESTRICT")
    )
    learning_status: Mapped[str] = mapped_column(String(20), server_default="learning")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class WorkspaceInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["task", "collection", "note", "favorite"]
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(default="", max_length=10000)
    priority: Literal["low", "normal", "high"] = "normal"
    category: str = Field(default="", max_length=60)
    due: date | None = None
    completed: bool = False
    collection_id: UUID | None = None
    song_id: UUID | None = None
    learning_status: Literal["learning", "practicing", "comfortable"] = "learning"

    @field_validator("title")
    @classmethod
    def title_required(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Title is required")
        return value.strip()


class WorkspaceView(WorkspaceInput):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_at: datetime
    updated_at: datetime


class WorkspaceRepository:
    def __init__(self, session: Session, actor: UUID):
        self.session, self.actor = session, actor

    def get(self, identifier: UUID) -> WorkspaceRecord | None:
        return self.session.scalar(
            select(WorkspaceRecord).where(
                WorkspaceRecord.id == identifier, WorkspaceRecord.owner_id == self.actor
            )
        )

    def list(self, kind: str | None, offset: int, limit: int) -> list[WorkspaceRecord]:
        query = select(WorkspaceRecord).where(WorkspaceRecord.owner_id == self.actor)
        if kind:
            query = query.where(WorkspaceRecord.kind == kind)
        return list(
            self.session.scalars(
                query.order_by(WorkspaceRecord.created_at.desc(), WorkspaceRecord.id)
                .offset(offset)
                .limit(limit)
            )
        )

    def save(
        self, data: WorkspaceInput, identifier: UUID | None = None
    ) -> WorkspaceRecord:
        if data.kind == "favorite" and data.song_id is None:
            raise ValueError("Choose a catalogue song")
        if data.song_id is not None:
            song = self.session.get(SongReference, data.song_id)
            if song is None or not song.reviewed:
                raise ValueError("Song is not available")
        if data.collection_id is not None:
            parent = self.get(data.collection_id)
            if (
                parent is None
                or parent.kind != "collection"
                or data.kind == "collection"
            ):
                raise ValueError("Choose one of your own collections")
        row = (
            self.get(identifier)
            if identifier
            else WorkspaceRecord(id=uuid4(), owner_id=self.actor)
        )
        if row is None:
            raise LookupError("Item not found")
        if identifier and row.kind != data.kind:
            raise ValueError("Item type cannot be changed")
        for key, value in data.model_dump().items():
            setattr(row, key, value)
        row.updated_at = datetime.now().astimezone()
        self.session.add(row)
        self.session.flush()
        return row

    def remove(self, identifier: UUID) -> bool:
        row = self.get(identifier)
        if row is None:
            return False
        self.session.delete(row)
        return True
