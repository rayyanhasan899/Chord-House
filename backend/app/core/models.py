"""Explicit metadata registration for migration composition, not domain imports."""

from app.modules.catalog.custom_chords import CustomChordRecord
from app.modules.catalog.models import (
    InstrumentRecord,
    TuningRecord,
    TuningStringRecord,
)
from app.modules.catalog.patterns import PatternFavorite, PatternRecord
from app.modules.catalog.songs import SongAuditRecord, SongImportRecord, SongRecord
from app.modules.content_management.models import (
    ContentAudit,
    ContentReport,
    ReferenceContent,
)
from app.modules.identity.models import (
    AccountRecord,
    RateRecord,
    SessionRecord,
    TokenRecord,
)
from app.modules.integration.models import (
    AssessmentRecord,
    ReminderDeliveryRecord,
    ReminderRecord,
)
from app.modules.personal_workspace.models import NoteRecord
from app.modules.personal_workspace.workspace import SongReference, WorkspaceRecord
from app.modules.practice.models import (
    ActivityRecord,
    GoalRecord,
    PracticeRecord,
    PracticeStartRecord,
    RoutineRecord,
)
from app.modules.practice.progress_models import MilestoneRecord, ReviewRecord

__all__ = [
    "AssessmentRecord",
    "ReminderRecord",
    "ReminderDeliveryRecord",
    "ReferenceContent",
    "ContentReport",
    "ContentAudit",
    "MilestoneRecord",
    "ReviewRecord",
    "AccountRecord",
    "SessionRecord",
    "TokenRecord",
    "RateRecord",
    "InstrumentRecord",
    "TuningRecord",
    "TuningStringRecord",
    "NoteRecord",
    "CustomChordRecord",
    "PatternRecord",
    "PatternFavorite",
    "SongRecord",
    "SongImportRecord",
    "SongAuditRecord",
    "WorkspaceRecord",
    "SongReference",
    "PracticeRecord",
    "RoutineRecord",
    "ActivityRecord",
    "GoalRecord",
    "PracticeStartRecord",
]
