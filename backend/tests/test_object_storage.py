"""Original byte fixtures; S3 protocol tests, not live-provider evidence."""

import hashlib
import io
import tempfile
import unittest
from pathlib import Path
from typing import Any

from app.modules.catalog.local_storage import LocalSongStorage
from app.modules.catalog.object_storage import ObjectSongStorage, StorageUnavailable
from app.modules.catalog.song_storage import CHUNK_BYTES


class Missing(Exception):
    response = {"Error": {"Code": "NoSuchKey"}}


class Client:
    def __init__(self) -> None:
        self.data: dict[str, bytes] = {}
        self.headers: dict[str, Any] = {}
        self.last: dict[str, Any] = {}
        self.body = io.BytesIO()
        self.ignore_range = False
        self.corrupt = False

    def head_object(self, **kw: Any) -> dict[str, Any]:
        if kw["Key"] not in self.data:
            raise Missing()
        return dict(self.headers[kw["Key"]], ContentLength=len(self.data[kw["Key"]]))

    def put_object(self, **kw: Any) -> None:
        data = kw["Body"].read()
        self.data[kw["Key"]] = data
        self.headers[kw["Key"]] = {
            "Metadata": kw["Metadata"],
            "ContentType": kw["ContentType"],
        }

    def get_object(self, **kw: Any) -> dict[str, Any]:
        self.last = kw
        data = self.data[kw["Key"]]
        content_range = ""
        if "Range" in kw and not self.ignore_range:
            start, end = kw["Range"][6:].split("-")
            first, last = int(start), int(end) if end else len(data) - 1
            content_range = f"bytes {first}-{last}/{len(data)}"
            data = data[first : last + 1]
        if self.corrupt:
            data = b"x" * len(data)
        self.body = io.BytesIO(data)
        return {"Body": self.body, "ContentRange": content_range}


class ObjectStorageTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        folder = root / "English songs" / "Original"
        folder.mkdir(parents=True)
        self.data = b"\xef\xbb\xbfOriginal\r\n\r\n  C\tG\r\n" + b"a" * CHUNK_BYTES
        (folder / "lyrics.txt").write_bytes(self.data)
        self.local = LocalSongStorage(root)
        self.asset = self.local.describe("English songs/Original/lyrics.txt")
        assert self.asset is not None
        self.client = Client()
        self.storage = ObjectSongStorage(self.client, "private")
        self.key = "songs/stable-id/revision/lyrics.txt"

    def upload(self) -> None:
        assert self.asset is not None
        self.storage.copy_verified(self.local, self.asset, self.key)

    def test_lossless_upload_and_idempotent_copy(self) -> None:
        self.upload()
        self.upload()
        self.assertEqual(self.client.data, {self.key: self.data})
        self.assertEqual(b"".join(self.storage.read(self.key)), self.data)
        self.assertEqual(
            self.storage.describe(self.key).sha256,
            hashlib.sha256(self.data).hexdigest(),
        )  # type: ignore[union-attr]

    def test_range_is_sent_and_exact(self) -> None:
        self.upload()
        self.assertEqual(b"".join(self.storage.read(self.key, 7, 10)), self.data[7:17])
        self.assertEqual(self.client.last["Range"], "bytes=7-16")
        self.assertTrue(self.client.body.closed)

    def test_cancel_closes_provider_body(self) -> None:
        self.upload()
        reader = self.storage.read(self.key)
        self.assertEqual(len(next(reader)), CHUNK_BYTES)
        reader.close()
        self.assertTrue(self.client.body.closed)

    def test_provider_ignoring_range_is_rejected(self) -> None:
        self.upload()
        self.client.ignore_range = True
        with self.assertRaises(StorageUnavailable):
            list(self.storage.read(self.key, 2, 3))
        self.assertTrue(self.client.body.closed)

    def test_corrupt_bytes_fail_independent_verification(self) -> None:
        self.client.corrupt = True
        with self.assertRaises(StorageUnavailable):
            self.upload()
        self.assertTrue((self.local.root / self.asset.key).exists())  # type: ignore[union-attr]

    def test_invalid_keys_and_missing_objects(self) -> None:
        for key in ("../private", "songs/../x", "songs//x", "songs/x\\y"):
            self.assertIsNone(self.storage.describe(key))
        self.assertIsNone(self.storage.describe(self.key))

    def test_truncated_range_is_rejected(self) -> None:
        self.upload()
        with self.assertRaises(StorageUnavailable):
            list(self.storage.read(self.key, len(self.data) - 2, 10))

    def test_zero_length_read_does_not_fetch(self) -> None:
        self.assertEqual(list(self.storage.read(self.key, 0, 0)), [])
        self.assertEqual(self.client.last, {})

    def test_upload_outage_is_sanitized(self) -> None:
        def failed_upload(**kw: Any) -> None:
            raise RuntimeError("Provider details must not escape")

        self.client.put_object = failed_upload  # type: ignore[method-assign]
        with self.assertRaisesRegex(StorageUnavailable, "Private media upload failed"):
            self.upload()
        assert self.asset is not None
        self.assertEqual((self.local.root / self.asset.key).read_bytes(), self.data)


if __name__ == "__main__":
    unittest.main()
