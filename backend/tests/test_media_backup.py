"""Offline bundle integrity and portable restore-path safety."""

import json
from pathlib import Path

import pytest

from app.modules.catalog.media_backup import checksum, postgres_env, safe_path, verify


@pytest.mark.parametrize(
    "key", ["../escape", "/escape", "C:escape", "C:/escape", "a/../b", "a\\b", "a//b"]
)
def test_restore_paths_cannot_escape(tmp_path: Path, key: str) -> None:
    with pytest.raises(ValueError, match="Unsafe backup path"):
        safe_path(tmp_path, key)


def test_verify_bundle_and_detect_modified_bytes(tmp_path: Path) -> None:
    dump = tmp_path / "database.dump"
    dump.write_bytes(b"Original disposable dump fixture")
    asset = tmp_path / "objects" / "original" / "lyrics.txt"
    asset.parent.mkdir(parents=True)
    asset.write_bytes(b"Original\r\n\r\n C\tG\r\n")
    manifest = {
        "version": 1,
        "dump_sha256": checksum(dump),
        "bindings": [
            {
                "files": [
                    {
                        "backup_path": "objects/original/lyrics.txt",
                        "size": asset.stat().st_size,
                        "sha256": checksum(asset),
                    }
                ]
            }
        ],
    }
    (tmp_path / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    assert verify(tmp_path) == {"version": 1, "bindings": 1, "state": "verified"}
    asset.write_bytes(b"Changed original fixture")
    with pytest.raises(ValueError, match="Invalid backup object"):
        verify(tmp_path)


def test_database_credentials_remain_out_of_command_arguments() -> None:
    env = postgres_env(
        "postgresql+psycopg://operator:private%40phrase@example.test:5432/chord_test?sslmode=require"
    )
    assert env["PGDATABASE"] == "chord_test"
    assert env["PGPASSWORD"] == "private@phrase"
    assert env["PGSSLMODE"] == "require"
