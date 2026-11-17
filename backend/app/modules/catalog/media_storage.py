"""Composition of local and private object adapters behind the existing port."""

from collections.abc import Iterator
from pathlib import Path

from app.modules.catalog.local_storage import LocalSongStorage
from app.modules.catalog.object_storage import ObjectSongStorage, object_storage
from app.modules.catalog.song_storage import Asset


class MediaStorage:
    def __init__(self, root: Path, objects: ObjectSongStorage | None = None):
        self.local = LocalSongStorage(root)
        self.objects = objects

    def adapter(self, key: str) -> LocalSongStorage | ObjectSongStorage:
        if key.startswith("songs/"):
            if self.objects is None:
                raise OSError("Object storage is not configured")
            return self.objects
        return self.local

    def describe(self, key: str) -> Asset | None:
        return self.adapter(key).describe(key)

    def read(
        self, key: str, start: int = 0, length: int | None = None
    ) -> Iterator[bytes]:
        return self.adapter(key).read(key, start, length)


def configured_storage(root: Path, bucket: str | None) -> MediaStorage:
    return MediaStorage(root, object_storage(bucket) if bucket else None)
