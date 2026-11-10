import os
import subprocess
import sys
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import delete, func, select, text
from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.catalog.models import (
    InstrumentRecord,
    TuningRecord,
    TuningStringRecord,
)
from app.modules.catalog.repository import SqlTuningRepository
from app.modules.catalog.seeds import seed_reference
from app.modules.identity.models import AccountRecord
from app.modules.personal_workspace.domain import LearningNote
from app.modules.personal_workspace.models import NoteRecord
from app.modules.personal_workspace.repository import SqlNoteRepository


def test_postgres_migrations_transactions_and_readiness(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip(
            "Set CHORD_TEST_DATABASE_URL to a disposable empty PostgreSQL database"
        )
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    monkeypatch.delenv("CHORD_DATABASE_URL_UNPOOLED", raising=False)
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    command.upgrade(config, "head")
    command.check(config)
    # A fresh process must resolve FK metadata without pytest's import side effects.
    subprocess.run(
        [sys.executable, "-m", "app.modules.catalog.seeds"],
        cwd=Path(__file__).parents[1],
        check=True,
    )
    db = Database(url)
    try:
        with db.transaction() as session:
            assert (
                session.scalar(text("SELECT version_num FROM alembic_version"))
                == "0012_integration"
            )
            session.execute(text("CREATE TABLE phase03_probe (id integer PRIMARY KEY)"))
        with pytest.raises(RuntimeError), db.transaction() as session:
            session.execute(text("INSERT INTO phase03_probe VALUES (1)"))
            raise RuntimeError("rollback")
        with db.transaction() as session:
            assert session.scalar(text("SELECT count(*) FROM phase03_probe")) == 0
            session.execute(text("DROP TABLE phase03_probe"))
        app = create_app(Settings(database_url=SecretStr(url)))
        with TestClient(app) as client:
            assert client.get("/api/v1/health/ready").json() == {"status": "ready"}
        assert db.engine.pool.checkedout() == 0  # type: ignore[attr-defined]
        user_a, user_b, note_id = uuid4(), uuid4(), uuid4()
        with db.transaction() as session:
            seed_reference(session)
            seed_reference(session)
            assert session.scalar(select(func.count()).select_from(TuningRecord)) == 8
            catalog = SqlTuningRepository(session)
            for instrument in ("acoustic_guitar", "electric_guitar"):
                for name, pitches in (
                    ("standard", (40, 45, 50, 55, 59, 64)),
                    ("drop_d", (38, 45, 50, 55, 59, 64)),
                    ("dadgad", (38, 45, 50, 55, 57, 62)),
                ):
                    tuning = catalog.get(instrument + ":" + name)
                    assert tuning is not None and tuning.pitches == pitches
            uke = catalog.get("ukulele:reentrant")
            assert uke is not None and uke.pitches == (67, 60, 64, 69)
            bass = catalog.get("bass:standard")
            assert bass is not None and bass.pitches == (28, 33, 38, 43)
            session.add_all([AccountRecord(id=user_a), AccountRecord(id=user_b)])
        with db.transaction() as session:
            repo = SqlNoteRepository(session)
            repo.add(user_a, LearningNote(note_id, user_a, "Practice carefully"))
        with db.transaction() as session:
            repo = SqlNoteRepository(session)
            assert repo.get(user_b, note_id) is None
            assert not repo.update(user_b, note_id, "stolen")
            assert not repo.delete(user_b, note_id)
            with pytest.raises(PermissionError):
                repo.add(user_b, LearningNote(uuid4(), user_a, "forged owner"))
            assert repo.update(user_a, note_id, "Updated")
            note = repo.get(user_a, note_id)
            assert note is not None and note.body == "Updated"
        with db.transaction() as session:
            extra = uuid4()
            repo = SqlNoteRepository(session)
            repo.add(user_a, LearningNote(extra, user_a, "Temporary"))
            session.flush()
            assert repo.delete(user_a, extra)
            assert repo.get(user_a, extra) is None
            stored = session.get(NoteRecord, note_id)
            assert stored is not None and stored.created_at.utcoffset() is not None
            tuning_row = session.get(TuningRecord, "bass:standard")
            assert tuning_row is not None
            tuning_row.archived = True
            session.flush()
            seed_reference(session)
            assert SqlTuningRepository(session).get("bass:standard") is None
        for model in [
            NoteRecord(id=uuid4(), owner_id=uuid4(), body="orphan"),
            NoteRecord(id=uuid4(), owner_id=user_a, body=""),
            InstrumentRecord(code="bass", string_count=4),
            TuningStringRecord(tuning_code="bass:standard", position=1, midi_pitch=28),
            TuningStringRecord(tuning_code="bass:standard", position=5, midi_pitch=128),
        ]:
            with pytest.raises(IntegrityError), db.transaction() as session:
                session.add(model)
                session.flush()
        with db.transaction() as session:
            session.execute(delete(AccountRecord).where(AccountRecord.id == user_a))
            assert session.scalar(select(func.count()).select_from(NoteRecord)) == 0
            assert session.scalar(select(func.count()).select_from(TuningRecord)) == 8
        with pytest.raises(IntegrityError), db.transaction() as session:
            session.execute(
                delete(InstrumentRecord).where(InstrumentRecord.code == "bass")
            )
        with db.transaction() as session:
            session.execute(delete(AccountRecord).where(AccountRecord.id == user_b))
            for table in [TuningStringRecord, TuningRecord, InstrumentRecord]:
                session.execute(delete(table))
        command.downgrade(config, "base")
        command.upgrade(config, "head")
        command.check(config)
    finally:
        db.close()
