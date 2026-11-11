"""Differential checks for the lighter rights-aware catalog listing projection."""

import copy
import json
import os
from datetime import UTC, datetime, timedelta
from importlib.resources import files
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import delete

from app.core.database import Database
from app.modules.catalog.song_schemas import SongInput, SongSummary
from app.modules.catalog.songs import SongRecord, Songs, detail
from app.modules.personal_workspace.workspace import SongReference


def test_listing_matches_detail_for_expiry_withdrawal_and_filters(monkeypatch):
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    db = Database(url)
    prefix = "quality-" + uuid4().hex
    identifiers = []
    expected = []
    try:
        with db.transaction() as session:
            for mode in range(6):
                raw = copy.deepcopy(
                    json.loads(
                        files("app.modules.catalog")
                        .joinpath("data", "original-songs.json")
                        .read_text(encoding="utf-8")
                    )[0]
                )
                raw["title"] = prefix + str(mode)
                raw["external_key"] = prefix + str(mode)
                if mode == 1:
                    raw["metadata_grant"]["expires_at"] = (
                        datetime.now(UTC) - timedelta(days=1)
                    ).isoformat()
                if mode == 2:
                    raw["arrangements"][0]["grant"]["display"] = False
                if mode == 3:
                    raw["texts"][0]["grant"]["reviewed"] = False
                data = SongInput.model_validate(raw)
                identifier = uuid4()
                identifiers.append(identifier)
                session.add(
                    SongReference(
                        id=identifier,
                        title=data.title,
                        artist=data.artist,
                        language=data.language,
                        reviewed=True,
                    )
                )
                session.flush()
                row = SongRecord(
                    id=identifier,
                    external_key=data.external_key,
                    identity_key=prefix + str(mode),
                    search_text=prefix + str(mode),
                    language=data.language,
                    status="withdrawn" if mode == 5 else "published",
                    document=data.model_dump(mode="json"),
                    withdrawn=(
                        [
                            "arrangement:" + data.arrangements[0].key,
                            "text:" + data.texts[0].key,
                        ]
                        if mode == 4
                        else []
                    ),
                    revision=1,
                )
                session.add(row)
                value = detail(row)
                if value:
                    expected.append(value)
        service = Songs(db)
        for availability in [None, "arrangement", "lyrics"]:
            for instrument in [None, "guitar", "bass"]:
                matching = [
                    item
                    for item in expected
                    if (availability != "arrangement" or item.arrangements)
                    and (availability != "lyrics" or item.texts)
                    and (
                        instrument is None
                        or any(a.instrument == instrument for a in item.arrangements)
                    )
                ]
                result = service.list(
                    prefix, None, "", None, instrument, "", availability, 0, 100
                )
                assert result.total == len(matching)
                assert result.items == [
                    SongSummary.model_validate(item.model_dump()) for item in matching
                ]
                page = service.list(
                    prefix, None, "", None, instrument, "", availability, 1, 1
                )
                assert page.items == result.items[1:2]
                assert page.total == result.total
    finally:
        with db.transaction() as session:
            session.execute(
                delete(SongReference).where(SongReference.id.in_(identifiers))
            )
        db.close()
