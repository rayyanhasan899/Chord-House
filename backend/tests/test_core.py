import json
import logging
from uuid import UUID

import pytest
from fastapi import Query
from fastapi.testclient import TestClient
from pydantic import SecretStr, ValidationError

from app.core.config import Settings
from app.core.logging import SafeJsonFormatter
from app.main import create_app


def test_health_errors_and_request_ids() -> None:
    app = create_app(Settings(database_url=None))
    with TestClient(app) as client:
        live = client.get("/api/v1/health/live", headers={"X-Request-ID": "untrusted"})
        assert live.json() == {"status": "ok"}
        UUID(live.headers["X-Request-ID"])
        ready = client.get("/api/v1/health/ready")
        assert ready.status_code == 503
        assert ready.json()["error"]["code"] == "not_ready"
        assert ready.json()["error"]["request_id"] == ready.headers["X-Request-ID"]
        missing = client.get("/missing?password=private")
        assert missing.status_code == 404
        assert "private" not in missing.text
        assert client.post("/api/v1/health/live").headers["allow"] == "GET"


def test_validation_and_unexpected_errors_hide_inputs() -> None:
    app = create_app(Settings(database_url=None))

    @app.get("/test-input")
    def endpoint(count: int = Query()) -> int:
        return count

    @app.get("/test-error")
    def broken() -> None:
        raise RuntimeError("password=private")

    with TestClient(app) as client:
        result = client.get("/test-input?count=private")
        assert result.status_code == 422
        assert result.json()["error"]["fields"][0]["field"] == "query.count"
        assert "private" not in result.text
        failure = client.get("/test-error")
        assert failure.status_code == 500
        assert "private" not in failure.text
        assert failure.headers["X-Request-ID"] == failure.json()["error"]["request_id"]


def test_settings_and_logs_do_not_expose_secrets() -> None:
    with pytest.raises(ValidationError) as error:
        Settings(database_url=SecretStr("sqlite:///private"))
    assert "private" not in str(error.value)
    config = Settings(
        database_url=SecretStr("postgresql+psycopg://user:private@localhost/db")
    )
    assert "private" not in repr(config)
    record = logging.LogRecord(
        "test", logging.ERROR, "", 1, "password=private", (), None
    )
    record.request_id = "safe"
    output = SafeJsonFormatter().format(record)
    assert "private" not in output
    assert json.loads(output)["request_id"] == "safe"


def test_unavailable_database_returns_safe_error() -> None:
    app = create_app(
        Settings(
            database_url=SecretStr(
                "postgresql+psycopg://user:private@127.0.0.1:1/missing"
            )
        )
    )
    with TestClient(app) as client:
        response = client.get("/api/v1/health/ready")
    assert response.status_code == 503
    assert "private" not in response.text
