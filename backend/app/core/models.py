"""Explicit metadata registration for migration composition, not domain imports."""

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

__all__ = [
    "AccountRecord",
    "SessionRecord",
    "TokenRecord",
    "RateRecord",
    "InstrumentRecord",
    "TuningRecord",
    "TuningStringRecord",
    "NoteRecord",
]
