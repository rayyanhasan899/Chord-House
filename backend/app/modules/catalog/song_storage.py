"""Application media contract; no HTTP, database or provider dependencies."""

from collections.abc import Iterator
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Asset:
    key: str
    size: int
    sha256: str
    media_type: str


class SongStorage(Protocol):
    def describe(self, key: str) -> Asset | None: ...

    def read(
        self, key: str, start: int = 0, length: int | None = None
    ) -> Iterator[bytes]: ...


MAX_AUDIO_BYTES = 100 * 1024 * 1024
MAX_LYRICS_BYTES = 400_000
CHUNK_BYTES = 64 * 1024
