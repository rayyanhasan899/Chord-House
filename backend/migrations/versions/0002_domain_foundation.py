"""Reference catalogue, minimal identity anchor and private ownership slice."""

import sqlalchemy as sa
from alembic import op

revision = "0002_domain_foundation"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "accounts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_table(
        "instruments",
        sa.Column("code", sa.String(40), primary_key=True),
        sa.Column("string_count", sa.Integer(), nullable=False),
        sa.CheckConstraint("string_count BETWEEN 1 AND 12", name="string_count"),
    )
    op.create_table(
        "tuning_presets",
        sa.Column("code", sa.String(80), primary_key=True),
        sa.Column(
            "instrument_code",
            sa.String(40),
            sa.ForeignKey("instruments.code", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("archived", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_tuning_presets_instrument_code", "tuning_presets", ["instrument_code"]
    )
    op.create_table(
        "tuning_strings",
        sa.Column(
            "tuning_code",
            sa.String(80),
            sa.ForeignKey("tuning_presets.code", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("position", sa.Integer(), primary_key=True),
        sa.Column("midi_pitch", sa.Integer(), nullable=False),
        sa.CheckConstraint("position BETWEEN 1 AND 12", name="position"),
        sa.CheckConstraint("midi_pitch BETWEEN 0 AND 127", name="pitch"),
    )
    op.create_table(
        "learning_notes",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("body", sa.Text(), nullable=False),
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
            "length(trim(body)) > 0 AND length(body) <= 10000", name="body_length"
        ),
    )
    op.create_index(
        "ix_learning_notes_owner_created", "learning_notes", ["owner_id", "created_at"]
    )


def downgrade() -> None:
    op.drop_table("learning_notes")
    op.drop_table("tuning_strings")
    op.drop_table("tuning_presets")
    op.drop_table("instruments")
    op.drop_table("accounts")
