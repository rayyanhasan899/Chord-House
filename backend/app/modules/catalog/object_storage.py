"""Private S3-compatible media. No browser credentials or signed public URLs."""

import hashlib
import os
import re
from collections.abc import Iterator
from typing import Any

from app.modules.catalog.song_storage import (
    CHUNK_BYTES,
    MAX_AUDIO_BYTES,
    MAX_LYRICS_BYTES,
    Asset,
)


class StorageUnavailable(OSError):
    """Provider outage, quota or unexpected integrity response."""


class ObjectSongStorage:
    def __init__(self, client: Any, bucket: str):
        self.client = client
        self.bucket = bucket

    @staticmethod
    def valid(key: str) -> bool:
        return (
            key.startswith("songs/")
            and all(p not in ("", ".", "..") for p in key.split("/"))
            and "\\" not in key
        )

    def describe(self, key: str) -> Asset | None:
        if not self.valid(key):
            return None
        try:
            head = self.client.head_object(Bucket=self.bucket, Key=key)
            digest = head.get("Metadata", {}).get("sha256", "")
            limit = MAX_AUDIO_BYTES if key.endswith("/audio.mp3") else MAX_LYRICS_BYTES
            if (
                not re.fullmatch(r"[0-9a-f]{64}", digest)
                or not 0 < int(head["ContentLength"]) <= limit
            ):
                raise StorageUnavailable("Invalid object metadata")
            return Asset(key, int(head["ContentLength"]), digest, head["ContentType"])
        except Exception as exc:
            if getattr(exc, "response", {}).get("Error", {}).get("Code") in (
                "404",
                "NoSuchKey",
                "NotFound",
            ):
                return None
            raise StorageUnavailable("Private media storage unavailable") from None

    def read(
        self, key: str, start: int = 0, length: int | None = None
    ) -> Iterator[bytes]:
        if not self.valid(key) or start < 0 or length is not None and length < 0:
            raise ValueError("Invalid object read")
        if length == 0:
            return
        params: dict[str, object] = {"Bucket": self.bucket, "Key": key}
        if length is not None or start:
            end = "" if length is None else str(start + length - 1)
            params["Range"] = f"bytes={start}-{end}"
        body = None
        try:
            result = self.client.get_object(**params)
            body = result["Body"]
            if "Range" in params:
                actual = result.get("ContentRange", "")
                prefix = f"bytes {start}-"
                if not actual.startswith(prefix):
                    raise StorageUnavailable("Provider did not honor byte range")
            remaining = length
            while remaining is None or remaining > 0:
                chunk = body.read(
                    CHUNK_BYTES if remaining is None else min(CHUNK_BYTES, remaining)
                )
                if not chunk:
                    if remaining:
                        raise StorageUnavailable("Truncated media response")
                    break
                yield chunk
                if remaining is not None:
                    remaining -= len(chunk)
        except Exception:
            raise StorageUnavailable("Private media read failed") from None
        finally:
            if body is not None:
                body.close()

    def copy_verified(self, source: Any, asset: Asset, key: str) -> Asset:
        if not self.valid(key):
            raise ValueError("Invalid object key")
        existing = self.describe(key)
        if existing is None:
            # Bounded local file stream; no whole recording buffered in memory.
            path = source.path(asset.key)
            if path is None:
                raise FileNotFoundError("Source disappeared")
            with path.open("rb") as stream:
                try:
                    self.client.put_object(
                        Bucket=self.bucket,
                        Key=key,
                        Body=stream,
                        ContentLength=asset.size,
                        ContentType=asset.media_type,
                        Metadata={"sha256": asset.sha256},
                    )
                except Exception:
                    raise StorageUnavailable("Private media upload failed") from None
        uploaded = self.describe(key)
        if uploaded != Asset(key, asset.size, asset.sha256, asset.media_type):
            raise StorageUnavailable("Uploaded metadata mismatch")
        # ETag and user-supplied metadata are NOT independent verification.
        digest = hashlib.sha256()
        size = 0
        for chunk in self.read(key):
            digest.update(chunk)
            size += len(chunk)
        if size != asset.size or digest.hexdigest() != asset.sha256:
            raise StorageUnavailable("Uploaded bytes failed checksum verification")
        return uploaded


def object_storage(bucket: str) -> ObjectSongStorage:
    if not os.environ.get("AWS_ENDPOINT_URL_S3", "").startswith("https://"):
        raise StorageUnavailable("HTTPS private object endpoint required")
    import boto3
    from botocore.config import Config

    return ObjectSongStorage(
        boto3.client(
            "s3",
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"},
                connect_timeout=5,
                read_timeout=20,
                retries={"max_attempts": 2, "mode": "standard"},
            ),
        ),
        bucket,
    )
