import os
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr, ValidationError
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.catalog.pattern_seeds import EXERCISES, seed_patterns
from app.modules.catalog.patterns import (
    PatternFavorite,
    PatternInput,
    PatternRecord,
    SharedPatternInput,
)
from app.modules.content_management.seeds import GRANT
from app.modules.identity.models import AccountRecord

DATA = dict(
    name="Private rhythm",
    meter="4/4",
    subdivision=2,
    strokes=list("DRDURUDU"),
    tempo_min=60,
    tempo_max=140,
    difficulty="beginner",
    style="General",
    description="Even strokes",
)
ORIGIN = {"Origin": "http://127.0.0.1:3000"}


@pytest.mark.parametrize(
    "patch",
    [
        {"strokes": list("DR")},
        {"strokes": list("RRRRRRRR")},
        {"strokes": list("DRDURUZU")},
        {"meter": "5/4"},
        {"subdivision": 3},
        {"subdivision": True},
        {"tempo_min": 150},
        {"tempo_max": 301},
        {"name": " "},
        {"owner_id": str(uuid4())},
    ],
)
def test_invalid_patterns(patch: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        PatternInput.model_validate(DATA | patch)


def test_shared_publication_and_original_seeds() -> None:
    with pytest.raises(ValidationError):
        SharedPatternInput.model_validate(DATA | {"status": "published"})
    for name, meter, subdivision, strokes, difficulty, style in EXERCISES:
        PatternInput.model_validate(
            DATA
            | dict(
                name=name,
                meter=meter,
                subdivision=subdivision,
                strokes=list(strokes),
                difficulty=difficulty,
                style=style,
            )
        )


def test_pattern_api_privacy_management_and_favorites(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    db = Database(url)
    app = create_app(
        Settings(
            database_url=SecretStr(url),
            environment="test",
            auth_limit=200,
            mail_directory=str(tmp_path),
        )
    )
    with (
        TestClient(app) as owner,
        TestClient(app) as other,
        TestClient(app) as manager,
        TestClient(app) as guest,
    ):

        def login(client: TestClient) -> tuple[UUID, dict[str, str]]:
            email = uuid4().hex + "@example.com"
            data = dict(
                email=email,
                password="Pattern test long phrase 123!",
                display_name="Player",
                acknowledge_privacy=True,
            )
            assert (
                client.post(
                    "/api/v1/auth/register", json=data, headers=ORIGIN
                ).status_code
                == 201
            )
            response = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": data["password"]},
                headers=ORIGIN,
            )
            assert response.status_code == 200
            return UUID(response.json()["id"]), ORIGIN | {
                "X-CSRF-Token": response.json()["csrf_token"]
            }

        owner_id, headers = login(owner)
        _, other_headers = login(other)
        manager_id, manager_headers = login(manager)
        with db.transaction() as session:
            row = session.get(AccountRecord, manager_id)
            assert row is not None
            row.role = "content_manager"
            seed_patterns(session)
            seed_patterns(session)
        assert guest.get("/api/v1/patterns").status_code == 401
        assert owner.get("/api/v1/managed-patterns").status_code == 403
        assert (
            owner.post(
                "/api/v1/managed-patterns", json=DATA, headers=headers
            ).status_code
            == 403
        )
        assert (
            owner.post("/api/v1/patterns", json=DATA, headers=ORIGIN).status_code == 403
        )
        response = owner.post("/api/v1/patterns", json=DATA, headers=headers)
        assert response.status_code == 201
        identifier = response.json()["id"]
        path = "/api/v1/patterns/" + identifier
        assert response.json()["status"] == "private"
        assert identifier not in [r["id"] for r in other.get("/api/v1/patterns").json()]
        assert other.put(path, json=DATA, headers=other_headers).status_code == 404
        assert other.delete(path, headers=other_headers).status_code == 404
        assert other.put(path + "/favorite", headers=other_headers).status_code == 404
        assert (
            owner.put(
                path, json=DATA | {"name": "Edited rhythm"}, headers=headers
            ).status_code
            == 200
        )
        assert (
            owner.post(
                "/api/v1/patterns", json=DATA | {"strokes": ["R"]}, headers=headers
            ).status_code
            == 422
        )
        assert owner.put(path + "/favorite", headers=headers).status_code == 204
        assert owner.put(path + "/favorite", headers=headers).status_code == 204
        assert next(
            r for r in owner.get("/api/v1/patterns").json() if r["id"] == identifier
        )["favorite"]
        assert owner.delete(path + "/favorite", headers=headers).status_code == 204
        assert owner.delete(path + "/favorite", headers=headers).status_code == 204
        shared = DATA | dict(
            status="draft",
            reviewed=True,
            grant=GRANT,
            rights_statement="Original test exercise authored here",
            attribution="Test author",
        )
        response = manager.post(
            "/api/v1/managed-patterns", json=shared, headers=manager_headers
        )
        assert response.status_code == 201
        shared_id = response.json()["id"]
        managed_path = "/api/v1/managed-patterns/" + shared_id
        assert shared_id not in [r["id"] for r in owner.get("/api/v1/patterns").json()]
        assert owner.put(managed_path, json=shared, headers=headers).status_code == 403
        assert owner.delete(managed_path, headers=headers).status_code == 403
        assert (
            manager.put(
                managed_path,
                json=shared | {"status": "published", "reviewed": False},
                headers=manager_headers,
            ).status_code
            == 422
        )
        assert (
            manager.put(
                managed_path,
                json=shared | {"status": "published"},
                headers=manager_headers,
            ).status_code
            == 200
        )
        assert shared_id in [r["id"] for r in owner.get("/api/v1/patterns").json()]
        assert (
            owner.put(
                "/api/v1/patterns/" + shared_id, json=DATA, headers=headers
            ).status_code
            == 404
        )
        assert (
            manager.put(
                "/api/v1/managed-patterns/" + identifier,
                json=shared,
                headers=manager_headers,
            ).status_code
            == 404
        )
        assert (
            owner.put(
                "/api/v1/patterns/" + shared_id + "/favorite", headers=headers
            ).status_code
            == 204
        )
        assert not next(
            r for r in other.get("/api/v1/patterns").json() if r["id"] == shared_id
        )["favorite"]
        assert (
            manager.put(managed_path, json=shared, headers=manager_headers).status_code
            == 200
        )
        assert shared_id not in [r["id"] for r in owner.get("/api/v1/patterns").json()]
        assert manager.delete(managed_path, headers=manager_headers).status_code == 204
        assert (
            next(
                r
                for r in manager.get("/api/v1/managed-patterns").json()
                if r["id"] == shared_id
            )["status"]
            == "archived"
        )
        assert owner.delete(path, headers=headers).status_code == 204
        assert owner.delete(path, headers=headers).status_code == 404
        assert len(owner.get("/api/v1/patterns?limit=2&offset=1").json()) == 2
        with db.transaction() as session:
            assert session.get(PatternRecord, UUID(identifier)) is None
            assert session.get(PatternFavorite, (owner_id, UUID(identifier))) is None
            session.execute(delete(AccountRecord).where(AccountRecord.id == owner_id))
        with db.transaction() as session:
            assert not list(
                session.scalars(
                    select(PatternFavorite).where(PatternFavorite.owner_id == owner_id)
                )
            )
        with pytest.raises(IntegrityError), db.transaction() as session:
            session.add(
                PatternRecord(
                    id=uuid4(),
                    owner_id=None,
                    status="private",
                    **DATA,
                    rights_statement="",
                    attribution="",
                    reviewed=False,
                )
            )
            session.flush()
    db.close()
