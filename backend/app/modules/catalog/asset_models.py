"""Active asset binding; stable song identity survives source location changes."""

from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SongAssetRecord(Base):
    __tablename__ = "song_asset_bindings"
    __table_args__ = (
        CheckConstraint("revision > 0", name="positive_revision"),
        CheckConstraint("source_kind IN ('local', 'object')", name="source_kind"),
    )
    song_id: Mapped[UUID] = mapped_column(
        ForeignKey("song_catalog.id", ondelete="CASCADE"), primary_key=True
    )
    source_kind: Mapped[str] = mapped_column(String(10), default="local")
    source_key: Mapped[str] = mapped_column(String(500), unique=True)
    revision: Mapped[int] = mapped_column(default=1)
    files: Mapped[dict[str, dict[str, str | int]]] = mapped_column(JSONB)
    rights_status: Mapped[str] = mapped_column(String(30), default="unverified")
