from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.modules.catalog.song_schemas import ImportView
from app.modules.catalog.songs import SongImportRecord, Songs
from app.modules.content_management.domain import require_manager
from app.modules.content_management.repository import SqlContentRepository
from app.modules.content_management.schemas import (
    AuditView,
    ContentView,
    ContentWrite,
    Kind,
    ReportInput,
    ReportView,
    Resolution,
)
from app.modules.content_management.service import ContentService
from app.modules.identity.domain import Actor
from app.modules.identity.routes import current, service
from app.modules.identity.service import IdentityService

router = APIRouter(prefix="/api/v1", tags=["content management"])
A = Annotated[Actor, Depends(current)]
S = Annotated[IdentityService, Depends(service)]
Offset = Annotated[int, Query(ge=0)]
Limit = Annotated[int, Query(ge=1, le=100)]


def content(svc: IdentityService) -> ContentService:
    return ContentService(SqlContentRepository(svc.db))


@router.get("/reference-content/{kind}", response_model=list[ContentView])
def references(
    kind: Literal["instrument", "tuning", "chord"],
    svc: S,
    offset: Offset = 0,
    limit: Limit = 100,
) -> list[ContentView]:
    # Reference content is intentionally guest-readable; actor IDs are redacted.
    return [
        item.model_copy(update={"actor_id": None})
        for item in SqlContentRepository(svc.db).public(kind, offset, limit)
    ]


@router.get("/content/{kind}", response_model=list[ContentView])
def list_content(
    kind: Kind, actor: A, svc: S, offset: Offset = 0, limit: Limit = 100
) -> list[ContentView]:
    return content(svc).entries(actor, kind, offset, limit)


@router.put("/content/{kind}/{key}", response_model=ContentView)
def save_content(
    kind: Kind, key: str, data: ContentWrite, actor: A, svc: S
) -> ContentView:
    return content(svc).save(actor, kind, key, data)


@router.get("/content-imports", response_model=list[ImportView])
def imports(
    actor: A, svc: S, offset: Offset = 0, limit: Limit = 100
) -> list[ImportView]:
    require_manager(actor)
    with svc.db.transaction() as session:
        return [
            Songs.view(row)
            for row in session.scalars(
                select(SongImportRecord)
                .order_by(SongImportRecord.created_at.desc(), SongImportRecord.id)
                .offset(offset)
                .limit(limit)
            )
        ]


@router.get("/content-imports/{identifier}/document")
def import_document(identifier: UUID, actor: A, svc: S) -> dict[str, object]:
    require_manager(actor)
    from app.modules.identity.domain import IdentityError

    with svc.db.transaction() as session:
        row = session.get(SongImportRecord, identifier)
        if row is None:
            raise IdentityError(404, "not_found", "Import not found")
        return row.payload


@router.post("/content-reports", response_model=ReportView, status_code=201)
def report(data: ReportInput, actor: A, svc: S) -> ReportView:
    return content(svc).report(actor, data)


@router.get("/content-reports", response_model=list[ReportView])
def reports(
    actor: A, svc: S, managed: bool = False, offset: Offset = 0, limit: Limit = 100
) -> list[ReportView]:
    return content(svc).reports(actor, managed, offset, limit)


@router.put("/content-reports/{identifier}", response_model=ReportView)
def resolve(identifier: UUID, data: Resolution, actor: A, svc: S) -> ReportView:
    return content(svc).resolve(actor, identifier, data)


@router.get("/content-audit", response_model=list[AuditView])
def audits(actor: A, svc: S, offset: Offset = 0, limit: Limit = 100) -> list[AuditView]:
    return content(svc).audits(actor, offset, limit)
