from collections.abc import Callable
from uuid import UUID

from sqlalchemy import select

from app.core.database import Base, Database
from app.modules.catalog.custom_chords import CustomChordRecord
from app.modules.catalog.patterns import PatternFavorite, PatternRecord
from app.modules.catalog.songs import SongAuditRecord
from app.modules.content_management.models import ContentAudit, ContentReport
from app.modules.identity.models import AccountRecord, SessionRecord, TokenRecord
from app.modules.integration.models import (
    AssessmentRecord,
    ReminderDeliveryRecord,
    ReminderRecord,
)
from app.modules.personal_workspace.models import NoteRecord
from app.modules.personal_workspace.workspace import WorkspaceRecord
from app.modules.practice.models import (
    ActivityRecord,
    GoalRecord,
    PracticeRecord,
    RoutineRecord,
)
from app.modules.practice.progress_models import MilestoneRecord, ReviewRecord
from app.modules.security.contracts import ExportSnapshot
from app.modules.security.domain import ExportValue, export_value

# This allowlist is intentional: adding an ORM column never automatically exports it.
PROFILE = (
    "id created_at email display_name role email_verified instrument skill "
    "timezone theme handedness tuning chord_display interests "
    "onboarding_complete"
)
RESOURCES: tuple[tuple[str, type[Base], str], ...] = (
    ("legacy_notes", NoteRecord, "id body created_at updated_at"),
    (
        "workspace",
        WorkspaceRecord,
        "id kind title body priority category due completed collection_id "
        "song_id learning_status created_at updated_at",
    ),
    ("custom_chords", CustomChordRecord, "id name instrument frets fingers created_at"),
    (
        "custom_patterns",
        PatternRecord,
        "id name meter subdivision strokes tempo_min tempo_max difficulty style"
        " description created_at updated_at",
    ),
    ("pattern_favorites", PatternFavorite, "pattern_id"),
    ("routines", RoutineRecord, "id name description instrument version created_at"),
    (
        "practice_sessions",
        PracticeRecord,
        "id state instrument focus notes song_id chord_id chord_name routine_id"
        " routine_snapshot timezone started_at ended_at running_since intervals"
        " duration_seconds target_seconds version",
    ),
    (
        "goals",
        GoalRecord,
        "id period minutes paused version effective_from effective_to",
    ),
    ("roadmap_completions", MilestoneRecord, "instrument milestone completed_at"),
    ("weekly_reviews", ReviewRecord, "week improvement version"),
    ("assessments", AssessmentRecord, "id payload created_at"),
    (
        "reminder_preferences",
        ReminderRecord,
        "enabled browser_notifications local_time weekdays version",
    ),
    ("reminder_dates", ReminderDeliveryRecord, "local_day"),
    (
        "content_reports",
        ContentReport,
        "id kind key message status revision created_at updated_at",
    ),
    ("sessions", SessionRecord, "last_seen expires_at"),
    ("pending_email_actions", TokenRecord, "purpose expires_at"),
)


def project(row: Base, fields: str) -> dict[str, ExportValue]:
    return {field: export_value(getattr(row, field)) for field in fields.split()}


class SqlExportRepository:
    def __init__(self, db: Database):
        self.db = db

    def read(
        self, owner: UUID, authorize: Callable[[str | None], bool]
    ) -> ExportSnapshot | None:
        with self.db.sessions() as session:
            session.connection(execution_options={"isolation_level": "REPEATABLE READ"})
            account = session.get(AccountRecord, owner)
            if account is None:
                return None
            if not authorize(account.password_hash):
                raise PermissionError("Current password confirmation failed")
            records: dict[str, list[dict[str, ExportValue]]] = {}
            for name, model, fields in RESOURCES:
                owner_column = getattr(model, "owner_id", None)
                if owner_column is None:
                    raise RuntimeError("Export resource requires explicit ownership")
                query = select(model).where(owner_column == owner)
                if model is AssessmentRecord:
                    query = query.where(AssessmentRecord.payload.is_not(None))
                records[name] = [project(row, fields) for row in session.scalars(query)]
            records["routine_activities"] = [
                project(
                    row,
                    "id routine_id position name duration_seconds tool bpm song_id "
                    "chord_id pattern_id chord_name requires_chord",
                )
                for row in session.scalars(
                    select(ActivityRecord)
                    .join(RoutineRecord)
                    .where(RoutineRecord.owner_id == owner)
                )
            ]
            for name, audit_model, fields in (
                ("content_actions", ContentAudit, "kind key action created_at"),
                (
                    "song_actions",
                    SongAuditRecord,
                    "song_id import_id action component_key created_at",
                ),
            ):
                records[name] = [
                    project(row, fields)
                    for row in session.scalars(
                        select(audit_model).where(audit_model.actor_id == owner)
                    )
                ]
            return ExportSnapshot(profile=project(account, PROFILE), records=records)
