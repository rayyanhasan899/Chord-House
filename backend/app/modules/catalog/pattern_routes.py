from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.modules.catalog.patterns import (
    PatternInput,
    Patterns,
    PatternView,
    SharedPatternInput,
)
from app.modules.identity.domain import Actor
from app.modules.identity.routes import current, service
from app.modules.identity.service import IdentityService

router = APIRouter(prefix="/api/v1", tags=["strumming patterns"])
A = Annotated[Actor, Depends(current)]
S = Annotated[IdentityService, Depends(service)]


@router.get("/patterns", response_model=list[PatternView])
def list_patterns(
    actor: A,
    svc: S,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> list[PatternView]:
    return Patterns(svc.db).list(actor, offset, limit)


@router.post("/patterns", response_model=PatternView, status_code=201)
def create_pattern(data: PatternInput, actor: A, svc: S) -> PatternView:
    return Patterns(svc.db).save(actor, data)


@router.put("/patterns/{identifier}", response_model=PatternView)
def update_pattern(
    identifier: UUID, data: PatternInput, actor: A, svc: S
) -> PatternView:
    return Patterns(svc.db).save(actor, data, identifier)


@router.delete("/patterns/{identifier}", status_code=204)
def delete_pattern(identifier: UUID, actor: A, svc: S) -> None:
    Patterns(svc.db).remove(actor, identifier)


@router.put("/patterns/{identifier}/favorite", status_code=204)
def favorite_pattern(identifier: UUID, actor: A, svc: S) -> None:
    Patterns(svc.db).favorite(actor, identifier, True)


@router.delete("/patterns/{identifier}/favorite", status_code=204)
def unfavorite_pattern(identifier: UUID, actor: A, svc: S) -> None:
    Patterns(svc.db).favorite(actor, identifier, False)


@router.get("/managed-patterns", response_model=list[PatternView])
def managed_patterns(
    actor: A,
    svc: S,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> list[PatternView]:
    return Patterns(svc.db).list(actor, offset, limit, True)


@router.post("/managed-patterns", response_model=PatternView, status_code=201)
def create_shared(data: SharedPatternInput, actor: A, svc: S) -> PatternView:
    return Patterns(svc.db).save(actor, data, shared=True)


@router.put("/managed-patterns/{identifier}", response_model=PatternView)
def update_shared(
    identifier: UUID, data: SharedPatternInput, actor: A, svc: S
) -> PatternView:
    return Patterns(svc.db).save(actor, data, identifier, True)


@router.delete("/managed-patterns/{identifier}", status_code=204)
def archive_shared(identifier: UUID, actor: A, svc: S) -> None:
    Patterns(svc.db).remove(actor, identifier, True)
