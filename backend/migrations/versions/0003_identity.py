"""Identity, preferences, session/token verifiers and shared throttling."""

import sqlalchemy as sa
from alembic import op

revision = "0003_identity"
down_revision = "0002_domain_foundation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for name, size, default in [
        ("email", 320, None),
        ("password_hash", 512, None),
        ("display_name", 80, "Learner"),
        ("role", 30, "user"),
        ("instrument", 40, "acoustic_guitar"),
        ("skill", 20, "beginner"),
        ("timezone", 100, "UTC"),
        ("theme", 10, "system"),
        ("handedness", 10, "right"),
        ("tuning", 40, "standard"),
        ("interests", 500, ""),
    ]:
        op.add_column(
            "accounts",
            sa.Column(
                name, sa.String(size), server_default=default, nullable=default is None
            ),
        )
    for name in ["email_verified", "onboarding_complete"]:
        op.add_column(
            "accounts",
            sa.Column(name, sa.Boolean(), server_default="false", nullable=False),
        )
    op.create_unique_constraint("uq_accounts_email", "accounts", ["email"])
    op.create_check_constraint(
        "role", "accounts", "role IN ('user','content_manager','admin')"
    )
    op.create_table(
        "identity_sessions",
        sa.Column("token_hash", sa.String(64), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("csrf_token", sa.String(64), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "identity_tokens",
        sa.Column("token_hash", sa.String(64), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("purpose", sa.String(10), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("purpose IN ('verify','reset')", name="purpose"),
    )
    op.create_table(
        "identity_rates",
        sa.Column("key", sa.String(64), primary_key=True),
        sa.Column("hits", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    for table in ["identity_sessions", "identity_tokens", "identity_rates"]:
        op.create_index("ix_" + table + "_expires_at", table, ["expires_at"])
        if table != "identity_rates":
            op.create_index("ix_" + table + "_owner_id", table, ["owner_id"])


def downgrade() -> None:
    for table in ["identity_rates", "identity_tokens", "identity_sessions"]:
        op.drop_table(table)
    op.drop_constraint(op.f("ck_accounts_role"), "accounts", type_="check")
    op.drop_constraint("uq_accounts_email", "accounts", type_="unique")
    for name in [
        "email",
        "password_hash",
        "display_name",
        "role",
        "instrument",
        "skill",
        "timezone",
        "theme",
        "handedness",
        "tuning",
        "interests",
        "email_verified",
        "onboarding_complete",
    ]:
        op.drop_column("accounts", name)
