"""Private roadmap completions and weekly reflection notes."""

import sqlalchemy as sa
from alembic import op

revision = "0010_progress"
down_revision = "0009_practice"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "roadmap_completions",
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("instrument", sa.String(24), primary_key=True),
        sa.Column("milestone", sa.String(40), primary_key=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "instrument IN ('acoustic_guitar','electric_guitar','bass','ukulele')",
            name=op.f("ck_roadmap_completions_instrument"),
        ),
    )
    op.create_table(
        "practice_weekly_reviews",
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("week", sa.String(10), primary_key=True),
        sa.Column("improvement", sa.String(2000), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "version > 0", name=op.f("ck_practice_weekly_reviews_version")
        ),
    )


def downgrade() -> None:
    op.drop_table("practice_weekly_reviews")
    op.drop_table("roadmap_completions")
