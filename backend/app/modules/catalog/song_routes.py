import time
from collections.abc import Iterator
from pathlib import Path
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.modules.catalog.asset_models import SongAssetRecord
from app.modules.catalog.local_storage import lyric_value
from app.modules.catalog.media_storage import configured_storage
from app.modules.catalog.song_schemas import (
    ImportInput,
    ImportView,
    SongDetail,
    SongPage,
    Withdrawal,
)
from app.modules.catalog.song_storage import Asset, SongStorage
from app.modules.catalog.songs import Songs
from app.modules.identity.domain import Actor, IdentityError
from app.modules.identity.routes import cookie_name, current, service
from app.modules.identity.service import IdentityService

router = APIRouter(prefix="/api/v1", tags=["songs"])
A = Annotated[Actor, Depends(current)]
S = Annotated[IdentityService, Depends(service)]


def catalogue(request: Request, svc: IdentityService) -> Songs:
    settings = request.app.state.settings
    return Songs(
        svc.db,
        Path(settings.songs_directory),
        configured_storage(Path(settings.songs_directory), settings.object_bucket),
        verified_only=settings.environment == "production",
    )


@router.get("/songs", response_model=SongPage)
def list_songs(
    actor: A,
    svc: S,
    response: Response,
    request: Request,
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
    return catalogue(request, svc).list(
        q, language, artist, difficulty, instrument, genre, availability, offset, limit
    )


@router.get("/songs/{identifier}", response_model=SongDetail)
def song(
    identifier: UUID, actor: A, svc: S, response: Response, request: Request
) -> SongDetail:
    response.headers["Cache-Control"] = "private, no-store"
    return catalogue(request, svc).get(identifier)


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


class LocalSongFiles(BaseModel):
    lyrics: str | None
    audio_url: str | None


def local_asset(
    identifier: UUID, request: Request, svc: IdentityService, name: str
) -> tuple[SongStorage, Asset] | None:
    # The regular aggregate enforces published/withdrawn metadata before media access.
    Songs(svc.db).get(identifier)
    with svc.db.transaction() as session:
        binding = session.get(SongAssetRecord, identifier)
        if binding is None:
            return None
        if (
            request.app.state.settings.environment == "production"
            and binding.rights_status != "verified"
        ):
            raise IdentityError(
                403,
                "rights_unverified",
                "Online media publication permission is not verified",
            )
        expected = binding.files.get(name)
    if expected is None:
        return None
    storage = configured_storage(
        Path(request.app.state.settings.songs_directory),
        request.app.state.settings.object_bucket,
    )
    try:
        asset = storage.describe(str(expected["key"]))
    except OSError:
        raise IdentityError(
            503, "media_unavailable", "Media storage is temporarily unavailable"
        ) from None
    if (
        asset is None
        or asset.sha256 != expected["sha256"]
        or asset.size != expected["size"]
    ):
        return None
    return storage, asset


@router.get("/songs/{identifier}/local-files", response_model=LocalSongFiles)
def local_files(
    identifier: UUID, request: Request, actor: A, svc: S, response: Response
) -> LocalSongFiles:
    svc.throttle(
        "media:" + actor.session_hash, request.app.state.settings.media_request_limit
    )
    audio = local_asset(identifier, request, svc, "audio.mp3")
    lyrics = local_asset(identifier, request, svc, "lyrics.txt")
    response.headers["Cache-Control"] = "private, no-store"
    return LocalSongFiles(
        lyrics=lyric_value(lyrics[0], lyrics[1].key) if lyrics else None,
        audio_url=f"/api/v1/songs/{identifier}/audio" if audio else None,
    )


def byte_range(value: str | None, size: int) -> tuple[int, int]:
    if value is None:
        return 0, size - 1
    import re

    match = re.fullmatch(r"bytes=(\d*)-(\d*)", value)
    if match is None or not any(match.groups()):
        raise ValueError("Invalid range")
    first, last = match.groups()
    if not first:
        count = int(last)
        if count <= 0:
            raise ValueError("Invalid suffix")
        return max(0, size - count), size - 1
    start, end = int(first), min(int(last), size - 1) if last else size - 1
    if start >= size or start > end:
        raise ValueError("Unsatisfiable range")
    return start, end


@router.get("/songs/{identifier}/audio", response_class=StreamingResponse)
@router.head("/songs/{identifier}/audio", response_class=StreamingResponse)
def local_audio(identifier: UUID, request: Request, actor: A, svc: S) -> Response:
    svc.throttle(
        "media:" + actor.session_hash, request.app.state.settings.media_request_limit
    )
    found = local_asset(identifier, request, svc, "audio.mp3")
    if found is None:
        raise IdentityError(
            404,
            "not_found",
            "Audio is not available; ask the operator to scan/sync changed files",
        )
    storage, asset = found
    headers = {
        "Cache-Control": "private, no-store",
        "Accept-Ranges": "bytes",
        "X-Content-Type-Options": "nosniff",
    }
    value = request.headers.get("range") if request.method == "GET" else None
    try:
        start, end = byte_range(value, asset.size)
    except ValueError:
        return Response(
            status_code=416,
            headers=headers | {"Content-Range": f"bytes */{asset.size}"},
        )
    length = end - start + 1
    headers["Content-Length"] = str(length)
    if value is not None:
        headers["Content-Range"] = f"bytes {start}-{end}/{asset.size}"
    if request.method == "HEAD":
        return Response(headers=headers, media_type=asset.media_type)
    reader = storage.read(asset.key, start, length)
    try:
        first = next(reader)
    except OSError, StopIteration:
        reader.close() if hasattr(reader, "close") else None
        raise IdentityError(
            503, "media_unavailable", "Media storage is temporarily unavailable"
        ) from None

    def authorized_chunks() -> Iterator[bytes]:
        checked = time.monotonic()
        try:
            yield first
            for chunk in reader:
                if time.monotonic() - checked >= 5:
                    svc.actor(request.cookies.get(cookie_name(request)))
                    checked = time.monotonic()
                yield chunk
        finally:
            if hasattr(reader, "close"):
                reader.close()

    return StreamingResponse(
        authorized_chunks(),
        status_code=206 if value is not None else 200,
        media_type=asset.media_type,
        headers=headers,
    )
