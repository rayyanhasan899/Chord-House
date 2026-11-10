"""Shared references, report privacy and redacted administrative history.

Existing timestamps start at migration time; no historical authorship is invented.
Reports cascade with their owner; audit actors are anonymized on deletion.
Catalogue keys are retained through archival, so reports keep stable targets.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0011_content"
down_revision = "0010_progress"
branch_labels = None
depends_on = None


def timestamps() -> list[sa.Column[sa.DateTime]]:
    return [
        sa.Column(
            name,
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        )
        for name in ("created_at", "updated_at")
    ]


def actor() -> sa.Column[sa.Uuid]:
    return sa.Column(
        "actor_id",
        sa.Uuid(),
        sa.ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True,
    )


def upgrade() -> None:
    for table in ("song_catalog", "strumming_patterns"):
        for column in timestamps():
            op.add_column(table, column)
        op.add_column(table, sa.Column("actor_id", sa.Uuid(), nullable=True))
        op.create_foreign_key(
            op.f(f"fk_{table}_actor_id_accounts"),
            table,
            "accounts",
            ["actor_id"],
            ["id"],
            ondelete="SET NULL",
        )
    op.add_column(
        "strumming_patterns",
        sa.Column("revision", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column("strumming_patterns", sa.Column("grant", JSONB(), nullable=True))
    op.create_table(
        "managed_references",
        sa.Column("kind", sa.String(16), primary_key=True),
        sa.Column("key", sa.String(150), primary_key=True),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("document", JSONB(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        *timestamps(),
        actor(),
        sa.CheckConstraint(
            "kind IN ('instrument','tuning','chord')",
            name=op.f("ck_managed_references_kind"),
        ),
        sa.CheckConstraint(
            "status IN ('draft','published','archived')",
            name=op.f("ck_managed_references_status"),
        ),
        sa.CheckConstraint("revision > 0", name=op.f("ck_managed_references_revision")),
    )
    op.create_index("ix_managed_references_status", "managed_references", ["status"])
    op.create_table(
        "content_reports",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "owner_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("key", sa.String(150), nullable=False),
        sa.Column("message", sa.String(2000), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        *timestamps(),
        sa.CheckConstraint(
            "status IN ('open','corrected','dismissed')",
            name=op.f("ck_content_reports_status"),
        ),
        sa.CheckConstraint(
            "kind IN ('instrument','tuning','chord','pattern','song')",
            name=op.f("ck_content_reports_kind"),
        ),
        sa.CheckConstraint(
            "length(trim(message)) > 0", name=op.f("ck_content_reports_message")
        ),
        sa.CheckConstraint("revision > 0", name=op.f("ck_content_reports_revision")),
    )
    op.create_index("ix_content_reports_owner_id", "content_reports", ["owner_id"])
    op.create_index("ix_content_reports_status", "content_reports", ["status"])
    op.create_table(
        "content_audit",
        sa.Column("id", sa.Uuid(), primary_key=True),
        actor(),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("key", sa.String(150), nullable=False),
        sa.Column("action", sa.String(40), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_content_audit_created_at", "content_audit", ["created_at"])


def downgrade() -> None:
    op.drop_table("content_audit")
    op.drop_table("content_reports")
    op.drop_table("managed_references")
    op.drop_column("strumming_patterns", "grant")
    op.drop_column("strumming_patterns", "revision")
    for table in ("song_catalog", "strumming_patterns"):
        op.drop_constraint(
            op.f(f"fk_{table}_actor_id_accounts"), table, type_="foreignkey"
        )
        for column in ("actor_id", "updated_at", "created_at"):
            op.drop_column(table, column)
