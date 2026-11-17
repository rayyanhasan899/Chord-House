"""Bounded local adapter. Never follow a symlink, trust a filename or alter text."""

import hashlib
from collections.abc import Iterator
from pathlib import Path

from app.modules.catalog.song_storage import (
    CHUNK_BYTES,
    MAX_AUDIO_BYTES,
    MAX_LYRICS_BYTES,
    Asset,
    SongStorage,
)


class LocalSongStorage:
    def __init__(self, root: Path):
        self.root = root.resolve()

    def path(self, key: str) -> Path | None:
        relative = Path(key)
        if relative.is_absolute() or ".." in relative.parts:
            return None
        candidate = self.root / relative
        try:
            if any(
                p.is_symlink()
                for p in (candidate, *candidate.parents)
                if p != self.root
            ):
                return None
            path = candidate.resolve()
            return path if path.is_relative_to(self.root) and path.is_file() else None
        except OSError, ValueError:
            return None

    def describe(self, key: str) -> Asset | None:
        path = self.path(key)
        if path is None or path.name not in ("audio.mp3", "lyrics.txt"):
            return None
        limit = MAX_AUDIO_BYTES if path.name == "audio.mp3" else MAX_LYRICS_BYTES
        try:
            size = path.stat().st_size
            if not 0 < size <= limit:
                return None
            with path.open("rb") as stream:
                head = stream.read(10)
                if path.name == "audio.mp3" and not (
                    head.startswith(b"ID3")
                    or len(head) >= 2
                    and head[0] == 255
                    and head[1] & 0xE0 == 0xE0
                ):
                    return None
                stream.seek(0)
                digest = hashlib.file_digest(stream, "sha256").hexdigest()
            if path.name == "lyrics.txt":
                value = path.read_bytes().decode("utf-8-sig")
                if not value.strip() or "\x00" in value:
                    return None
            return Asset(
                key,
                size,
                digest,
                "audio/mpeg"
                if path.name == "audio.mp3"
                else "text/plain; charset=utf-8",
            )
        except OSError, UnicodeError:
            return None

    def read(
        self, key: str, start: int = 0, length: int | None = None
    ) -> Iterator[bytes]:
        path = self.path(key)
        if path is None or start < 0 or length is not None and length < 0:
            raise FileNotFoundError("Song asset is unavailable")
        # The caller validates the active asset before opening; streaming is bounded.
        with path.open("rb") as stream:
            stream.seek(start)
            remaining = length
            while remaining is None or remaining > 0:
                data = stream.read(
                    CHUNK_BYTES if remaining is None else min(CHUNK_BYTES, remaining)
                )
                if not data:
                    break
                yield data
                if remaining is not None:
                    remaining -= len(data)


def lyric_value(storage: SongStorage, key: str) -> str | None:
    asset = storage.describe(key)
    if asset is None:
        return None
    return b"".join(storage.read(key)).decode("utf-8-sig")
