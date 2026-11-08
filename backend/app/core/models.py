"""Explicit metadata registration for migration composition, not domain imports."""

from app.modules.catalog.custom_chords import CustomChordRecord
from app.modules.catalog.models import (
    InstrumentRecord,
    TuningRecord,
    TuningStringRecord,
)
from app.modules.identity.models import (
    AccountRecord,
    RateRecord,
    SessionRecord,
    TokenRecord,
)
from app.modules.personal_workspace.models import NoteRecord
from app.modules.personal_workspace.workspace import SongReference, WorkspaceRecord

__all__ = [
    "AccountRecord",
    "SessionRecord",
    "TokenRecord",
    "RateRecord",
    "InstrumentRecord",
    "TuningRecord",
    "TuningStringRecord",
    "NoteRecord",
    "CustomChordRecord",
    "WorkspaceRecord",
    "SongReference",
]
