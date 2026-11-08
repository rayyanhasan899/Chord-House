"""Private/shared rhythms and isolated favorites."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0007_patterns"
down_revision = "0006_custom_chords"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "strumming_patterns",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("status", sa.String(12), nullable=False),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("meter", sa.String(4), nullable=False),
        sa.Column("subdivision", sa.Integer(), nullable=False),
        sa.Column("strokes", postgresql.JSONB(), nullable=False),
        sa.Column("tempo_min", sa.Integer(), nullable=False),
        sa.Column("tempo_max", sa.Integer(), nullable=False),
        sa.Column("difficulty", sa.String(16), nullable=False),
        sa.Column("style", sa.String(40), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("rights_statement", sa.Text(), nullable=False),
        sa.Column("attribution", sa.String(200), nullable=False),
        sa.Column("reviewed", sa.Boolean(), nullable=False),
        sa.CheckConstraint(
            "(owner_id IS NOT NULL AND status = 'private') OR "
            "(owner_id IS NULL AND status IN ('draft','published','archived'))",
            name=op.f("ck_strumming_patterns_visibility"),
        ),
        sa.CheckConstraint(
            "subdivision IN (1,2,4)", name=op.f("ck_strumming_patterns_subdivision")
        ),
        sa.CheckConstraint(
            "tempo_min >= 30 AND tempo_max <= 300 AND tempo_min <= tempo_max",
            name=op.f("ck_strumming_patterns_tempo"),
        ),
        sa.CheckConstraint(
            "meter IN ('2/4','3/4','4/4','6/8')",
            name=op.f("ck_strumming_patterns_meter"),
        ),
        sa.CheckConstraint(
            "difficulty IN ('beginner','intermediate','advanced')",
            name=op.f("ck_strumming_patterns_difficulty"),
        ),
        sa.CheckConstraint(
            "length(trim(name)) > 0", name=op.f("ck_strumming_patterns_name")
        ),
    )
    op.create_index(
        "ix_strumming_patterns_owner_id", "strumming_patterns", ["owner_id"]
    )
    op.create_index("ix_strumming_patterns_status", "strumming_patterns", ["status"])
    op.create_table(
        "pattern_favorites",
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "pattern_id",
            sa.Uuid(),
            sa.ForeignKey("strumming_patterns.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("pattern_favorites")
    op.drop_table("strumming_patterns")
