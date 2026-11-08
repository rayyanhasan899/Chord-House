import json
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.identity.models import AccountRecord, SessionRecord
from app.modules.identity.service import digest

ORIGIN = {"Origin": "http://127.0.0.1:3000"}
PASSWORD = "a long private phrase 123!"


def test_identity_journeys(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Requires disposable PostgreSQL")
    monkeypatch.setenv("CHORD_DATABASE_URL", url)
    command.upgrade(Config(str(Path(__file__).parents[1] / "alembic.ini")), "head")
    app = create_app(
        Settings(
            database_url=SecretStr(url),
            environment="test",
            auth_limit=200,
            mail_directory=str(tmp_path),
        )
    )
    email = uuid4().hex + "@example.com"
    second_email = uuid4().hex + "@example.com"
    db = Database(url)

    def mail(purpose: str) -> str:
        matches = [json.loads(p.read_text()) for p in tmp_path.glob("*.json")]
        return next(
            item["token"]
            for item in reversed(matches)
            if item["purpose"] == purpose
            and item["recipient"].casefold() == email.casefold()
        )

    with TestClient(app) as first, TestClient(app) as second:
        payload = {
            "email": email.upper(),
            "password": PASSWORD,
            "display_name": "Learner",
            "acknowledge_privacy": True,
        }
        assert first.post("/api/v1/auth/register", json=payload).status_code == 403
        assert (
            first.post(
                "/api/v1/auth/register", json=payload, headers=ORIGIN
            ).status_code
            == 201
        )
        assert (
            first.post(
                "/api/v1/auth/register", json=payload, headers=ORIGIN
            ).status_code
            == 409
        )
        verify_token = mail("verify")
        assert (
            first.post(
                "/api/v1/auth/verify/confirm",
                json={"token": verify_token},
                headers=ORIGIN,
            ).status_code
            == 200
        )
        assert (
            first.post(
                "/api/v1/auth/verify/confirm",
                json={"token": verify_token},
                headers=ORIGIN,
            ).status_code
            == 400
        )
        login = first.post(
            "/api/v1/auth/login",
            json={"email": email, "password": PASSWORD},
            headers=ORIGIN,
        )
        assert login.status_code == 200
        assert (
            "HttpOnly" in login.headers["set-cookie"]
            and "SameSite=lax" in login.headers["set-cookie"]
        )
        data = login.json()
        csrf = ORIGIN | {"X-CSRF-Token": data["csrf_token"]}
        owner = data["id"]
        token = first.cookies["chord_session"]
        with db.transaction() as session:
            row = session.get(SessionRecord, digest(token))
            assert row is not None and row.token_hash != token
            account = session.get(AccountRecord, row.owner_id)
            assert account is not None and account.password_hash.startswith(
                "$argon2id$"
            )
        profile = {
            "display_name": "My learning",
            "instrument": "ukulele",
            "skill": "beginner",
            "timezone": "Asia/Karachi",
            "tuning": "reentrant",
        }
        assert (
            first.patch("/api/v1/me", json=profile, headers=ORIGIN).status_code == 403
        )
        assert (
            first.patch(
                "/api/v1/me",
                json=profile,
                headers=csrf | {"Origin": "https://evil.invalid"},
            ).status_code
            == 403
        )
        assert (
            first.patch(
                "/api/v1/me", json=profile | {"role": "admin"}, headers=csrf
            ).status_code
            == 422
        )
        assert first.patch("/api/v1/me", json=profile, headers=csrf).json()[
            "onboarding_complete"
        ]
        assert first.get("/api/v1/admin/access").status_code == 403
        with db.transaction() as session:
            account = session.get(AccountRecord, UUID(owner))
            assert account is not None
            account.role = "content_manager"
        assert first.get("/api/v1/admin/access").status_code == 200
        with db.transaction() as session:
            account = session.get(AccountRecord, UUID(owner))
            assert account is not None
            account.role = "user"
        payload["email"] = second_email
        assert (
            second.post(
                "/api/v1/auth/register", json=payload, headers=ORIGIN
            ).status_code
            == 201
        )
        assert (
            second.post(
                "/api/v1/auth/login",
                json={"email": second_email, "password": PASSWORD},
                headers=ORIGIN,
            ).status_code
            == 200
        )
        assert second.get("/api/v1/me").json()["display_name"] == "Learner"
        assert (
            first.patch(
                "/api/v1/me",
                json=profile | {"owner_id": second.get("/api/v1/me").json()["id"]},
                headers=csrf,
            ).status_code
            == 422
        )
        assert first.get("/api/v1/me/" + owner).status_code == 404
        production = create_app(
            Settings(
                database_url=SecretStr(url),
                environment="production",
                trusted_origins=["https://app.example.com"],
                smtp_host="unused.example.com",
            )
        )
        with TestClient(
            production,
            base_url="https://app.example.com",
            client=("secure-cookie-test", 123),
        ) as secure:
            secure_login = secure.post(
                "/api/v1/auth/login",
                json={"email": email, "password": PASSWORD},
                headers={"Origin": "https://app.example.com"},
            )
            assert (
                secure_login.status_code == 200
                and "Secure" in secure_login.headers["set-cookie"]
            )
        from app.modules.personal_workspace.workspace import SongReference

        song_id = uuid4()
        with db.transaction() as session:
            session.add(
                SongReference(
                    id=song_id,
                    title="Test-only song",
                    artist="Fixture",
                    language="en",
                    reviewed=True,
                )
            )
        for kind in ("task", "collection", "note", "favorite"):
            item = {
                "kind": kind,
                "title": "Private item",
                "song_id": str(song_id) if kind == "favorite" else None,
            }
            created = first.post("/api/v1/workspace", json=item, headers=csrf)
            assert created.status_code == 201
            identifier = created.json()["id"]
            other_csrf = ORIGIN | {
                "X-CSRF-Token": second.get("/api/v1/me").json()["csrf_token"]
            }
            assert all(
                row["id"] != identifier
                for row in second.get("/api/v1/workspace").json()
            )
            assert (
                second.put(
                    "/api/v1/workspace/" + identifier, json=item, headers=other_csrf
                ).status_code
                == 404
            )
            assert (
                second.delete(
                    "/api/v1/workspace/" + identifier, headers=other_csrf
                ).status_code
                == 404
            )
            if kind == "collection":
                assert (
                    second.post(
                        "/api/v1/workspace",
                        json={
                            "kind": "note",
                            "title": "bad link",
                            "collection_id": identifier,
                        },
                        headers=other_csrf,
                    ).status_code
                    == 422
                )
            assert (
                first.put(
                    "/api/v1/workspace/" + identifier,
                    json=item | {"title": "Updated"},
                    headers=csrf,
                ).status_code
                == 200
            )
            assert (
                first.delete(
                    "/api/v1/workspace/" + identifier, headers=csrf
                ).status_code
                == 204
            )
        shape = {
            "name": "My C",
            "instrument": "guitar",
            "frets": [-1, 3, 2, 0, 1, 0],
            "fingers": [0, 3, 2, 0, 1, 0],
        }
        created = first.post("/api/v1/custom-chords", json=shape, headers=csrf)
        assert created.status_code == 201
        chord_id = created.json()["id"]
        assert all(
            c["id"] != chord_id for c in second.get("/api/v1/custom-chords").json()
        )
        assert (
            second.put(
                "/api/v1/custom-chords/" + chord_id, json=shape, headers=other_csrf
            ).status_code
            == 404
        )
        assert (
            second.delete(
                "/api/v1/custom-chords/" + chord_id, headers=other_csrf
            ).status_code
            == 404
        )
        assert (
            first.put(
                "/api/v1/custom-chords/" + chord_id,
                json=shape | {"name": "Edited C"},
                headers=csrf,
            ).status_code
            == 200
        )
        assert (
            first.post(
                "/api/v1/custom-chords",
                json=shape | {"frets": [24, 1, 2, 0, 1, 0]},
                headers=csrf,
            ).status_code
            == 422
        )
        assert (
            first.delete("/api/v1/custom-chords/" + chord_id, headers=csrf).status_code
            == 204
        )
        changed = first.post(
            "/api/v1/auth/password",
            json={"current_password": PASSWORD, "new_password": PASSWORD + "new"},
            headers=csrf,
        )
        assert changed.status_code == 200
        first.cookies.set("chord_session", token)
        assert first.get("/api/v1/me").status_code == 401
        first.cookies.clear()
        assert (
            first.post(
                "/api/v1/auth/login",
                json={"email": email, "password": PASSWORD},
                headers=ORIGIN,
            ).status_code
            == 401
        )
        assert (
            first.post(
                "/api/v1/auth/reset/request", json={"email": email}, headers=ORIGIN
            ).json()
            == first.post(
                "/api/v1/auth/reset/request",
                json={"email": "missing@example.com"},
                headers=ORIGIN,
            ).json()
        )
        reset = mail("reset")
        assert (
            first.post(
                "/api/v1/auth/reset/confirm",
                json={"token": reset, "password": PASSWORD},
                headers=ORIGIN,
            ).status_code
            == 200
        )
        assert (
            first.post(
                "/api/v1/auth/reset/confirm",
                json={"token": reset, "password": PASSWORD},
                headers=ORIGIN,
            ).status_code
            == 400
        )
        login = first.post(
            "/api/v1/auth/login",
            json={"email": email, "password": PASSWORD},
            headers=ORIGIN,
        )
        csrf = ORIGIN | {"X-CSRF-Token": login.json()["csrf_token"]}
        active = first.cookies["chord_session"]
        with db.transaction() as session:
            row = session.get(SessionRecord, digest(active))
            assert row is not None
            row.last_seen = datetime.now(UTC) - timedelta(days=2)
        assert first.get("/api/v1/me").status_code == 401
        first.cookies.clear()
        login = first.post(
            "/api/v1/auth/login",
            json={"email": email, "password": PASSWORD},
            headers=ORIGIN,
        )
        csrf = ORIGIN | {"X-CSRF-Token": login.json()["csrf_token"]}
        assert (
            first.post(
                "/api/v1/me/delete",
                json={"current_password": PASSWORD, "confirm": True},
                headers=csrf,
            ).status_code
            == 200
        )
        assert first.get("/api/v1/me").status_code == 401
        csrf2 = ORIGIN | {"X-CSRF-Token": second.get("/api/v1/me").json()["csrf_token"]}
        old = second.cookies["chord_session"]
        assert second.post("/api/v1/auth/logout", headers=csrf2).status_code == 200
        second.cookies.set("chord_session", old)
        assert second.get("/api/v1/me").status_code == 401
    limited = create_app(
        Settings(
            database_url=SecretStr(url),
            environment="test",
            auth_limit=1,
            mail_directory=str(tmp_path),
        )
    )
    with TestClient(limited, client=("limiter-client", 123)) as client:
        request = {"email": "nobody@example.com", "password": PASSWORD}
        assert (
            client.post("/api/v1/auth/login", json=request, headers=ORIGIN).status_code
            == 401
        )
        assert (
            client.post("/api/v1/auth/login", json=request, headers=ORIGIN).status_code
            == 429
        )
    db.close()
