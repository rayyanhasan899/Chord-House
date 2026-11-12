from pathlib import Path
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.exc import IntegrityError

from app.modules.identity.domain import Actor, IdentityError
from app.modules.identity.routes import current, service
from app.modules.identity.service import IdentityService
from app.modules.personal_workspace.workspace import (
    WorkspaceInput,
    WorkspaceRepository,
    WorkspaceView,
)

router = APIRouter(prefix="/api/v1/workspace", tags=["workspace"])
ActorDep = Annotated[Actor, Depends(current)]
ServiceDep = Annotated[IdentityService, Depends(service)]


@router.get("", response_model=list[WorkspaceView])
def items(
    actor: ActorDep,
    svc: ServiceDep,
    kind: Literal["task", "collection", "note", "favorite"] | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> list[WorkspaceView]:
    with svc.db.transaction() as session:
        return [
            WorkspaceView.model_validate(row)
            for row in WorkspaceRepository(session, actor.id).list(kind, offset, limit)
        ]


@router.post("", response_model=WorkspaceView, status_code=201)
def create(data: WorkspaceInput, actor: ActorDep, svc: ServiceDep) -> WorkspaceView:
    return save(data, actor, svc)


def save(
    data: WorkspaceInput,
    actor: Actor,
    svc: IdentityService,
    identifier: UUID | None = None,
) -> WorkspaceView:
    try:
        with svc.db.transaction() as session:
            return WorkspaceView.model_validate(
                WorkspaceRepository(session, actor.id).save(data, identifier)
            )
    except LookupError:
        raise IdentityError(404, "not_found", "Item not found") from None
    except ValueError as exc:
        raise IdentityError(422, "invalid_item", str(exc)) from None
    except IntegrityError:
        raise IdentityError(
            409, "favorite_conflict", "Song is already saved; refresh and retry"
        ) from None


@router.put("/{identifier}", response_model=WorkspaceView)
def update(
    identifier: UUID, data: WorkspaceInput, actor: ActorDep, svc: ServiceDep
) -> WorkspaceView:
    return save(data, actor, svc, identifier)


@router.delete("/{identifier}", status_code=204)
def remove(identifier: UUID, actor: ActorDep, svc: ServiceDep) -> None:
    with svc.db.transaction() as session:
        if not WorkspaceRepository(session, actor.id).remove(identifier):
            raise IdentityError(404, "not_found", "Item not found")


@router.get("/songs")
def songs(
    request: Request,
    actor: ActorDep,
    svc: ServiceDep,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> list[dict[str, str]]:
    from app.modules.catalog.songs import Songs

    page = Songs(svc.db, Path(request.app.state.settings.songs_directory)).list(
        "", None, "", None, None, "", None, offset, limit
    )
    return [
        {
            "id": str(row.id),
            "title": row.title,
            "artist": row.artist,
            "language": row.language,
        }
        for row in page.items
    ]
