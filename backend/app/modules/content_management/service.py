import re
from typing import Protocol
from uuid import UUID

from pydantic import ValidationError

from app.modules.content_management.domain import require_manager
from app.modules.content_management.schemas import (
    AuditView,
    ContentView,
    ContentWrite,
    Kind,
    ReportInput,
    ReportView,
    Resolution,
    validate_document,
)
from app.modules.identity.domain import Actor, IdentityError


class ContentRepository(Protocol):
    def entries(self, kind: Kind, offset: int, limit: int) -> list[ContentView]: ...
    def save(
        self, actor_id: UUID, kind: Kind, key: str, data: ContentWrite
    ) -> ContentView: ...
    def public(self, kind: Kind, offset: int, limit: int) -> list[ContentView]: ...
    def report(self, owner: UUID, data: ReportInput) -> ReportView: ...
    def reports(
        self, owner: UUID | None, offset: int, limit: int
    ) -> list[ReportView]: ...
    def resolve(
        self, actor: UUID, identifier: UUID, data: Resolution
    ) -> ReportView: ...
    def audits(self, offset: int, limit: int) -> list[AuditView]: ...


def validate_key(kind: Kind, key: str) -> None:
    if kind in ("song", "pattern"):
        try:
            UUID(key)
        except ValueError:
            raise IdentityError(
                422, "invalid_key", "Use a UUID for songs and patterns"
            ) from None
    elif not re.fullmatch(r"[a-z0-9][a-z0-9:_-]{0,79}", key):
        raise IdentityError(422, "invalid_key", "Use a short lowercase catalogue code")


class ContentService:
    def __init__(self, repository: ContentRepository):
        self.repository = repository

    def entries(
        self, actor: Actor, kind: Kind, offset: int, limit: int
    ) -> list[ContentView]:
        require_manager(actor)
        return self.repository.entries(kind, offset, limit)

    def save(
        self, actor: Actor, kind: Kind, key: str, data: ContentWrite
    ) -> ContentView:
        require_manager(actor)
        validate_key(kind, key)
        try:
            document = validate_document(kind, data)
        except ValueError, ValidationError:
            raise IdentityError(
                422,
                "invalid_content",
                "Check content structure, strings, rhythm and "
                "current reviewed worldwide rights",
            ) from None
        return self.repository.save(
            actor.id, kind, key, data.model_copy(update={"document": document})
        )

    def report(self, actor: Actor, data: ReportInput) -> ReportView:
        validate_key(data.kind, data.key)
        if not data.message.strip():
            raise IdentityError(422, "invalid_report", "Describe the content problem")
        return self.repository.report(actor.id, data)

    def reports(
        self, actor: Actor, managed: bool, offset: int, limit: int
    ) -> list[ReportView]:
        if managed:
            require_manager(actor)
        return self.repository.reports(None if managed else actor.id, offset, limit)

    def resolve(self, actor: Actor, identifier: UUID, data: Resolution) -> ReportView:
        require_manager(actor)
        return self.repository.resolve(actor.id, identifier, data)

    def audits(self, actor: Actor, offset: int, limit: int) -> list[AuditView]:
        require_manager(actor)
        return self.repository.audits(offset, limit)
