import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import text

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app


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
    db = Database(url)
    try:
        with db.transaction() as session:
            assert (
                session.scalar(text("SELECT version_num FROM alembic_version"))
                == "0001_baseline"
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
        command.downgrade(config, "base")
        command.upgrade(config, "head")
        command.check(config)
    finally:
        db.close()
