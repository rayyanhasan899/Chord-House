"""Private custom chord fingerings."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0006_custom_chords"
down_revision = "0005_workspace"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "custom_chords",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("instrument", sa.String(20), nullable=False),
        sa.Column("frets", postgresql.JSONB(), nullable=False),
        sa.Column("fingers", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_custom_chords_owner_id", "custom_chords", ["owner_id"])


def downgrade() -> None:
    op.drop_table("custom_chords")
