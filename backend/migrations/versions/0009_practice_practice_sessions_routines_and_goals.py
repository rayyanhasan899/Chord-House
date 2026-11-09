"""practice sessions routines and goals"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0009_practice"
down_revision = "0008_songs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Reviewed additive practice tables; existing rows are unchanged.
    op.create_table(
        "practice_goals",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("period", sa.String(length=8), nullable=False),
        sa.Column("minutes", sa.Integer(), nullable=False),
        sa.Column("paused", sa.Boolean(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("effective_to", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "minutes >= 1 AND ((period='daily' AND minutes <= 1440) "
            "OR (period='weekly' AND minutes <= 10080))",
            name=op.f("ck_practice_goals_minutes"),
        ),
        sa.CheckConstraint(
            "period IN ('daily','weekly')", name=op.f("ck_practice_goals_period")
        ),
        sa.CheckConstraint(
            "effective_to IS NULL OR effective_to >= effective_from",
            name=op.f("ck_practice_goals_effective"),
        ),
        sa.CheckConstraint("version > 0", name=op.f("ck_practice_goals_version")),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["accounts.id"],
            name=op.f("fk_practice_goals_owner_id_accounts"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_practice_goals")),
        sa.UniqueConstraint(
            "owner_id", "period", "version", name=op.f("uq_practice_goals_owner_id")
        ),
    )
    op.create_index(
        "uq_practice_current_goal",
        "practice_goals",
        ["owner_id", "period"],
        unique=True,
        postgresql_where=sa.text("effective_to IS NULL"),
    )
    op.create_table(
        "practice_routines",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("client_key", sa.Uuid(), nullable=False),
        sa.Column("creation_hash", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("instrument", sa.String(length=24), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "instrument IN ('acoustic_guitar','electric_guitar','bass','ukulele')",
            name=op.f("ck_practice_routines_instrument"),
        ),
        sa.CheckConstraint(
            "length(trim(name)) > 0", name=op.f("ck_practice_routines_name")
        ),
        sa.CheckConstraint("version > 0", name=op.f("ck_practice_routines_version")),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["accounts.id"],
            name=op.f("fk_practice_routines_owner_id_accounts"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_practice_routines")),
        sa.UniqueConstraint(
            "owner_id", "client_key", name=op.f("uq_practice_routines_owner_id")
        ),
    )
    op.create_index(
        op.f("ix_practice_routines_owner_id"),
        "practice_routines",
        ["owner_id"],
        unique=False,
    )
    op.create_table(
        "practice_activities",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("routine_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("requires_chord", sa.Boolean(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("tool", sa.String(length=20), nullable=False),
        sa.Column("bpm", sa.Integer(), nullable=False),
        sa.Column("song_id", sa.Uuid(), nullable=True),
        sa.Column("chord_id", sa.Uuid(), nullable=True),
        sa.Column("pattern_id", sa.Uuid(), nullable=True),
        sa.Column("chord_name", sa.String(length=15), nullable=False),
        sa.CheckConstraint(
            "tool IN ('none','metronome','chords','pattern','song','tuner')",
            name=op.f("ck_practice_activities_tool"),
        ),
        sa.CheckConstraint(
            "bpm BETWEEN 30 AND 300", name=op.f("ck_practice_activities_bpm")
        ),
        sa.CheckConstraint(
            "duration_seconds BETWEEN 1 AND 14400",
            name=op.f("ck_practice_activities_duration"),
        ),
        sa.CheckConstraint(
            "length(trim(name)) > 0", name=op.f("ck_practice_activities_name")
        ),
        sa.CheckConstraint(
            "position BETWEEN 0 AND 29", name=op.f("ck_practice_activities_position")
        ),
        sa.ForeignKeyConstraint(
            ["chord_id"],
            ["custom_chords.id"],
            name=op.f("fk_practice_activities_chord_id_custom_chords"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["pattern_id"],
            ["strumming_patterns.id"],
            name=op.f("fk_practice_activities_pattern_id_strumming_patterns"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["routine_id"],
            ["practice_routines.id"],
            name=op.f("fk_practice_activities_routine_id_practice_routines"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["song_id"],
            ["song_references.id"],
            name=op.f("fk_practice_activities_song_id_song_references"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_practice_activities")),
        sa.UniqueConstraint(
            "routine_id", "position", name=op.f("uq_practice_activities_routine_id")
        ),
    )
    op.create_table(
        "practice_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("state", sa.String(length=10), nullable=False),
        sa.Column("instrument", sa.String(length=24), nullable=False),
        sa.Column("focus", sa.String(length=200), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("song_id", sa.Uuid(), nullable=True),
        sa.Column("chord_id", sa.Uuid(), nullable=True),
        sa.Column("chord_name", sa.String(length=15), nullable=False),
        sa.Column("routine_id", sa.Uuid(), nullable=True),
        sa.Column(
            "routine_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("timezone", sa.String(length=80), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("running_since", sa.DateTime(timezone=True), nullable=True),
        sa.Column("intervals", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("target_seconds", sa.Integer(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "(state IN ('ended','saved')) = (ended_at IS NOT NULL)",
            name=op.f("ck_practice_sessions_ended"),
        ),
        sa.CheckConstraint(
            "(state='active') = (running_since IS NOT NULL)",
            name=op.f("ck_practice_sessions_running"),
        ),
        sa.CheckConstraint(
            "instrument IN ('acoustic_guitar','electric_guitar','bass','ukulele')",
            name=op.f("ck_practice_sessions_instrument"),
        ),
        sa.CheckConstraint(
            "state <> 'saved' OR duration_seconds BETWEEN 1 AND 86400",
            name=op.f("ck_practice_sessions_saved_duration"),
        ),
        sa.CheckConstraint(
            "state IN ('active','paused','ended','saved')",
            name=op.f("ck_practice_sessions_state"),
        ),
        sa.CheckConstraint(
            "duration_seconds >= 0", name=op.f("ck_practice_sessions_duration")
        ),
        sa.CheckConstraint(
            "ended_at IS NULL OR ended_at >= started_at",
            name=op.f("ck_practice_sessions_timestamps"),
        ),
        sa.CheckConstraint(
            "target_seconds IS NULL OR target_seconds BETWEEN 1 AND 86400",
            name=op.f("ck_practice_sessions_target"),
        ),
        sa.CheckConstraint("version > 0", name=op.f("ck_practice_sessions_version")),
        sa.ForeignKeyConstraint(
            ["chord_id"],
            ["custom_chords.id"],
            name=op.f("fk_practice_sessions_chord_id_custom_chords"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["accounts.id"],
            name=op.f("fk_practice_sessions_owner_id_accounts"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["routine_id"],
            ["practice_routines.id"],
            name=op.f("fk_practice_sessions_routine_id_practice_routines"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["song_id"],
            ["song_references.id"],
            name=op.f("fk_practice_sessions_song_id_song_references"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_practice_sessions")),
    )
    op.create_index(
        "ix_practice_owner_started",
        "practice_sessions",
        ["owner_id", "started_at"],
        unique=False,
    )
    op.create_index(
        "uq_practice_open_owner",
        "practice_sessions",
        ["owner_id"],
        unique=True,
        postgresql_where=sa.text("state <> 'saved'"),
    )
    op.create_table(
        "practice_start_keys",
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("client_key", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=True),
        sa.Column("creation_hash", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["accounts.id"],
            name=op.f("fk_practice_start_keys_owner_id_accounts"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["practice_sessions.id"],
            name=op.f("fk_practice_start_keys_session_id_practice_sessions"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint(
            "owner_id", "client_key", name=op.f("pk_practice_start_keys")
        ),
        sa.UniqueConstraint(
            "session_id", name=op.f("uq_practice_start_keys_session_id")
        ),
    )


def downgrade() -> None:
    # Reviewed additive practice tables; existing rows are unchanged.
    op.drop_table("practice_start_keys")
    op.drop_index(
        "uq_practice_open_owner",
        table_name="practice_sessions",
        postgresql_where=sa.text("state <> 'saved'"),
    )
    op.drop_index("ix_practice_owner_started", table_name="practice_sessions")
    op.drop_table("practice_sessions")
    op.drop_table("practice_activities")
    op.drop_index(op.f("ix_practice_routines_owner_id"), table_name="practice_routines")
    op.drop_table("practice_routines")
    op.drop_index(
        "uq_practice_current_goal",
        table_name="practice_goals",
        postgresql_where=sa.text("effective_to IS NULL"),
    )
    op.drop_table("practice_goals")
