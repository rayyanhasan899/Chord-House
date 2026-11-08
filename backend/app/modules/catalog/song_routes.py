from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response

from app.modules.catalog.song_schemas import (
    ImportInput,
    ImportView,
    SongDetail,
    SongPage,
    Withdrawal,
)
from app.modules.catalog.songs import Songs
from app.modules.identity.domain import Actor
from app.modules.identity.routes import current, service
from app.modules.identity.service import IdentityService

router = APIRouter(prefix="/api/v1", tags=["songs"])
A = Annotated[Actor, Depends(current)]
S = Annotated[IdentityService, Depends(service)]


@router.get("/songs", response_model=SongPage)
def list_songs(
    actor: A,
    svc: S,
    response: Response,
    q: str = Query("", max_length=200),
    language: Literal["en", "ur", "hi"] | None = None,
    artist: str = Query("", max_length=200),
    difficulty: Literal["beginner", "intermediate", "advanced"] | None = None,
    instrument: Literal["guitar", "bass", "ukulele"] | None = None,
    genre: str = Query("", max_length=60),
    availability: Literal["arrangement", "lyrics"] | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> SongPage:
    response.headers["Cache-Control"] = "private, no-store"
    return Songs(svc.db).list(
        q, language, artist, difficulty, instrument, genre, availability, offset, limit
    )


@router.get("/songs/{identifier}", response_model=SongDetail)
def song(identifier: UUID, actor: A, svc: S, response: Response) -> SongDetail:
    response.headers["Cache-Control"] = "private, no-store"
    return Songs(svc.db).get(identifier)


@router.post("/song-imports", response_model=ImportView, status_code=201)
def stage_import(data: ImportInput, actor: A, svc: S) -> ImportView:
    return Songs(svc.db).stage(actor, data)


@router.get("/song-imports/{identifier}", response_model=ImportView)
def preview_import(identifier: UUID, actor: A, svc: S) -> ImportView:
    return Songs(svc.db).preview(actor, identifier)


@router.post("/song-imports/{identifier}/commit", response_model=ImportView)
def commit_import(identifier: UUID, actor: A, svc: S) -> ImportView:
    return Songs(svc.db).commit(actor, identifier)


@router.post("/managed-songs/{identifier}/withdraw", status_code=204)
def withdraw_song(identifier: UUID, data: Withdrawal, actor: A, svc: S) -> None:
    Songs(svc.db).withdraw(actor, identifier, data)
