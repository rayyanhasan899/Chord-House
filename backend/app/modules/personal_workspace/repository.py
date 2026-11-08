from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.modules.personal_workspace.domain import LearningNote
from app.modules.personal_workspace.models import NoteRecord


class SqlNoteRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, actor_id: UUID, note_id: UUID) -> LearningNote | None:
        row = self.session.scalar(
            select(NoteRecord).where(
                NoteRecord.id == note_id, NoteRecord.owner_id == actor_id
            )
        )
        return LearningNote(row.id, row.owner_id, row.body) if row else None

    def add(self, actor_id: UUID, note: LearningNote) -> None:
        if note.owner_id != actor_id:
            raise PermissionError("Owner does not match actor")
        self.session.add(NoteRecord(id=note.id, owner_id=actor_id, body=note.body))

    def update(self, actor_id: UUID, note_id: UUID, body: str) -> bool:
        LearningNote(note_id, actor_id, body)
        result = self.session.scalar(
            update(NoteRecord)
            .where(NoteRecord.id == note_id, NoteRecord.owner_id == actor_id)
            .values(body=body, updated_at=func.now())
            .returning(NoteRecord.id)
        )
        return result is not None

    def delete(self, actor_id: UUID, note_id: UUID) -> bool:
        result = self.session.scalar(
            delete(NoteRecord)
            .where(NoteRecord.id == note_id, NoteRecord.owner_id == actor_id)
            .returning(NoteRecord.id)
        )
        return result is not None
