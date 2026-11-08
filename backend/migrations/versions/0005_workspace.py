"""Owner-scoped workspace items."""

import sqlalchemy as sa
from alembic import op

revision = "0005_workspace"
down_revision = "0004_chord_display"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "song_references",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("artist", sa.String(200), nullable=False),
        sa.Column("language", sa.String(10), nullable=False),
        sa.Column("reviewed", sa.Boolean(), server_default="false", nullable=False),
    )
    op.create_table(
        "workspace_items",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("priority", sa.String(10), nullable=False),
        sa.Column("category", sa.String(60), nullable=False),
        sa.Column("due", sa.Date(), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=False),
        sa.Column(
            "song_id",
            sa.Uuid(),
            sa.ForeignKey("song_references.id", ondelete="RESTRICT"),
        ),
        sa.Column(
            "learning_status", sa.String(20), server_default="learning", nullable=False
        ),
        sa.Column(
            "collection_id",
            sa.Uuid(),
            sa.ForeignKey("workspace_items.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "kind IN ('task','collection','note','favorite')", name="kind"
        ),
        sa.CheckConstraint("priority IN ('low','normal','high')", name="priority"),
        sa.CheckConstraint("length(trim(title)) > 0", name="title"),
    )
    op.create_index(
        "ix_workspace_owner_kind_created",
        "workspace_items",
        ["owner_id", "kind", "created_at"],
    )


def downgrade() -> None:
    op.drop_table("workspace_items")
    op.drop_table("song_references")
