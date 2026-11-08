from dataclasses import dataclass
from typing import Protocol
from uuid import UUID


@dataclass(frozen=True)
class LearningNote:
    id: UUID
    owner_id: UUID
    body: str

    def __post_init__(self) -> None:
        if not isinstance(self.id, UUID) or not isinstance(self.owner_id, UUID):
            raise ValueError("Note and owner identifiers must be UUIDs")
        if not self.body.strip() or len(self.body) > 10000:
            raise ValueError("Note body must contain 1 to 10000 characters")


class NoteRepository(Protocol):
    def get(self, actor_id: UUID, note_id: UUID) -> LearningNote | None: ...
    def add(self, actor_id: UUID, note: LearningNote) -> None: ...
    def update(self, actor_id: UUID, note_id: UUID, body: str) -> bool: ...
    def delete(self, actor_id: UUID, note_id: UUID) -> bool: ...
