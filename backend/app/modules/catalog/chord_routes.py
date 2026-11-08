from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.modules.catalog.custom_chords import ChordInput, ChordView, CustomChords
from app.modules.identity.domain import Actor
from app.modules.identity.routes import current, service
from app.modules.identity.service import IdentityService

router = APIRouter(prefix="/api/v1/custom-chords", tags=["custom chords"])
A = Annotated[Actor, Depends(current)]
S = Annotated[IdentityService, Depends(service)]


@router.get("", response_model=list[ChordView])
def list_chords(
    actor: A,
    svc: S,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> list[ChordView]:
    return CustomChords(svc.db).list(actor.id, offset, limit)


@router.post("", response_model=ChordView, status_code=201)
def create_chord(data: ChordInput, actor: A, svc: S) -> ChordView:
    return CustomChords(svc.db).save(actor.id, data)


@router.put("/{identifier}", response_model=ChordView)
def update_chord(identifier: UUID, data: ChordInput, actor: A, svc: S) -> ChordView:
    return CustomChords(svc.db).save(actor.id, data, identifier)


@router.delete("/{identifier}", status_code=204)
def delete_chord(identifier: UUID, actor: A, svc: S) -> None:
    CustomChords(svc.db).remove(actor.id, identifier)
