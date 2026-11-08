"""Versioned catalogue, staged imports and unique workspace favorites."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0008_songs"
down_revision = "0007_patterns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "song_catalog",
        sa.Column(
            "id",
            sa.Uuid(),
            sa.ForeignKey("song_references.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("external_key", sa.String(150), nullable=False, unique=True),
        sa.Column("identity_key", sa.String(500), nullable=False, unique=True),
        sa.Column("search_text", sa.Text(), nullable=False),
        sa.Column("language", sa.String(2), nullable=False),
        sa.Column("status", sa.String(15), nullable=False),
        sa.Column("document", postgresql.JSONB(), nullable=False),
        sa.Column("withdrawn", postgresql.JSONB(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
    )
    op.create_index("ix_song_catalog_language", "song_catalog", ["language"])
    op.create_index("ix_song_catalog_status", "song_catalog", ["status"])
    op.create_table(
        "song_imports",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("state", sa.String(15), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("versions", postgresql.JSONB(), nullable=False),
        sa.Column("issues", postgresql.JSONB(), nullable=False),
        sa.Column(
            "actor_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_table(
        "song_audit_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "actor_id",
            sa.Uuid(),
            sa.ForeignKey("accounts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "song_id",
            sa.Uuid(),
            sa.ForeignKey("song_catalog.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "import_id",
            sa.Uuid(),
            sa.ForeignKey("song_imports.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("action", sa.String(40), nullable=False),
        sa.Column("component_key", sa.String(80), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_song_audit_events_created_at", "song_audit_events", ["created_at"]
    )
    # Preserve any historical duplicates as notes instead of deleting user content.
    op.execute("""UPDATE workspace_items SET kind='note' WHERE id IN (
        SELECT id FROM (SELECT id, row_number() OVER
        (PARTITION BY owner_id,song_id ORDER BY created_at,id) AS n
        FROM workspace_items WHERE kind='favorite' AND song_id IS NOT NULL) d
        WHERE d.n > 1)""")
    op.create_index(
        "uq_workspace_favorite_song",
        "workspace_items",
        ["owner_id", "song_id"],
        unique=True,
        postgresql_where=sa.text("kind='favorite'"),
    )


def downgrade() -> None:
    op.drop_index("uq_workspace_favorite_song", table_name="workspace_items")
    op.drop_table("song_audit_events")
    op.drop_table("song_imports")
    op.drop_table("song_catalog")
