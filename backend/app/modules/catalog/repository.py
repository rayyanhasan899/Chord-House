from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.catalog.domain import Tuning
from app.modules.catalog.models import TuningRecord, TuningStringRecord


class SqlTuningRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, code: str) -> Tuning | None:
        row = self.session.scalar(
            select(TuningRecord).where(
                TuningRecord.code == code, TuningRecord.archived.is_(False)
            )
        )
        if row is None:
            return None
        pitches = self.session.scalars(
            select(TuningStringRecord.midi_pitch)
            .where(TuningStringRecord.tuning_code == code)
            .order_by(TuningStringRecord.position)
        )
        return Tuning(row.code, row.instrument_code, tuple(pitches))
