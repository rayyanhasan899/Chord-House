"""Private training assessments and opt-in reminder preferences."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0012_integration"
down_revision = "0011_content"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "training_assessments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("client_key", sa.Uuid(), nullable=False),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "owner_id", "client_key", name=op.f("uq_training_assessments_owner_id")
        ),
    )
    op.create_index(
        op.f("ix_training_assessments_owner_id"), "training_assessments", ["owner_id"]
    )
    op.create_table(
        "practice_reminder_preferences",
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("browser_notifications", sa.Boolean(), nullable=False),
        sa.Column("local_time", sa.String(5), nullable=False),
        sa.Column("weekdays", postgresql.JSONB(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "version > 0", name=op.f("ck_practice_reminder_preferences_version")
        ),
    )

    op.create_table(
        "practice_reminder_deliveries",
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("local_day", sa.Date(), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("practice_reminder_deliveries")
    op.drop_table("practice_reminder_preferences")
    op.drop_index(
        op.f("ix_training_assessments_owner_id"), table_name="training_assessments"
    )
    op.drop_table("training_assessments")
