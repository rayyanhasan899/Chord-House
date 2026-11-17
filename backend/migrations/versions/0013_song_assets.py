"""Active local/online song asset bindings; no file bytes in PostgreSQL."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0013_song_assets"
down_revision = "0012_integration"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "song_asset_bindings",
        sa.Column("song_id", sa.Uuid(), nullable=False),
        sa.Column("source_kind", sa.String(10), nullable=False),
        sa.Column("source_key", sa.String(500), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("files", postgresql.JSONB(), nullable=False),
        sa.Column("rights_status", sa.String(30), nullable=False),
        sa.CheckConstraint(
            "revision > 0", name=op.f("ck_song_asset_bindings_positive_revision")
        ),
        sa.CheckConstraint(
            "source_kind IN ('local', 'object')",
            name=op.f("ck_song_asset_bindings_source_kind"),
        ),
        sa.ForeignKeyConstraint(["song_id"], ["song_catalog.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("song_id"),
        sa.UniqueConstraint("source_key"),
    )


def downgrade() -> None:
    op.drop_table("song_asset_bindings")
