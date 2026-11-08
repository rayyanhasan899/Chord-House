"""Complete profile display preferences for the Phase 06 form."""

import sqlalchemy as sa
from alembic import op

revision = "0004_chord_display"
down_revision = "0003_identity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column(
            "chord_display", sa.String(20), server_default="diagrams", nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_column("accounts", "chord_display")
