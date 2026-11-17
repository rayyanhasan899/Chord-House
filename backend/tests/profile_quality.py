"""Measure disposable catalog/API work; never fall back to an application DB."""

import json
import os
import platform
import statistics
import tempfile
from datetime import UTC, datetime
from importlib.resources import files
from pathlib import Path
from time import perf_counter
from uuid import uuid4

from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import delete, insert, text

from app.core.config import Settings
from app.core.database import Database
from app.main import create_app
from app.modules.catalog.asset_models import SongAssetRecord
from app.modules.catalog.local_storage import LocalSongStorage
from app.modules.catalog.song_domain import normalize
from app.modules.catalog.song_schemas import SongInput
from app.modules.catalog.songs import SongRecord
from app.modules.identity.models import AccountRecord
from app.modules.personal_workspace.workspace import SongReference


def main() -> None:
    url = os.environ.get("CHORD_TEST_DATABASE_URL")
    if not url:
        raise RuntimeError("CHORD_TEST_DATABASE_URL must name a disposable migrated DB")
    db = Database(url)
    identifiers = [uuid4() for _ in range(5000)]
    account = None
    prefix = "Quality fixture " + uuid4().hex + " "
    original = json.loads(
        files("app.modules.catalog")
        .joinpath("data", "original-songs.json")
        .read_text(encoding="utf-8")
    )[0]
    # Original project-authored content only, with unique disposable identities.
    documents = []
    for index in range(len(identifiers)):
        item = original | {
            "external_key": prefix + str(index),
            "title": prefix + f"{index:05d}",
            "language": ["en", "ur", "hi"][index % 3],
        }
        documents.append(SongInput.model_validate(item).model_dump(mode="json"))
    media = tempfile.TemporaryDirectory(prefix="chord-quality-media-")
    media_root = Path(media.name)
    (media_root / "lyrics.txt").write_text(
        "Original profiling exercise", encoding="utf-8"
    )
    asset = LocalSongStorage(media_root).describe("lyrics.txt")
    assert asset is not None
    from dataclasses import asdict

    try:
        with db.transaction() as session:
            session.execute(
                insert(SongReference),
                [
                    dict(
                        id=identifier,
                        title=item["title"],
                        artist=item["artist"],
                        language=item["language"],
                        reviewed=True,
                    )
                    for identifier, item in zip(identifiers, documents, strict=True)
                ],
            )
            session.execute(
                insert(SongRecord),
                [
                    dict(
                        id=identifier,
                        external_key=item["external_key"],
                        identity_key=normalize(str(item["title"])),
                        search_text=normalize(str(item["title"])),
                        language=item["language"],
                        status="published",
                        document=item,
                        withdrawn=[],
                        revision=1,
                    )
                    for identifier, item in zip(identifiers, documents, strict=True)
                ],
            )
            session.execute(
                insert(SongAssetRecord),
                [
                    dict(
                        song_id=identifier,
                        source_kind="local",
                        source_key="quality/" + str(identifier),
                        revision=1,
                        files={"lyrics.txt": asdict(asset)},
                        rights_status="original_fixture",
                    )
                    for identifier in identifiers
                ],
            )
        with tempfile.TemporaryDirectory(prefix="chord-quality-mail-") as mail:
            settings = Settings(
                database_url=SecretStr(url),
                environment="test",
                mail_directory=mail,
                auth_limit=1000,
                songs_directory=str(media_root),
            )
            with TestClient(create_app(settings)) as client:
                email = uuid4().hex + "@example.com"
                password = "Disposable profiling phrase 123!"
                headers = {"Origin": "http://127.0.0.1:3000"}
                registration = client.post(
                    "/api/v1/auth/register",
                    headers=headers,
                    json=dict(
                        email=email,
                        password=password,
                        display_name="Disposable profiler",
                        acknowledge_privacy=True,
                    ),
                )
                assert registration.status_code == 201
                with db.transaction() as session:
                    account = session.scalar(
                        text("SELECT id FROM accounts WHERE email = :email"),
                        {"email": email},
                    )
                assert (
                    client.post(
                        "/api/v1/auth/login",
                        headers=headers,
                        json=dict(email=email, password=password),
                    ).status_code
                    == 200
                )
                measurements = []
                for params in [
                    {"q": prefix},
                    {"q": prefix, "language": "ur"},
                    {"q": prefix + "04999"},
                    {"q": prefix, "offset": 4980},
                    {"q": prefix, "availability": "lyrics"},
                ]:
                    samples = []
                    for _ in range(6):
                        started = perf_counter()
                        response = client.get(
                            "/api/v1/songs", params=params | {"limit": 20}
                        )
                        samples.append((perf_counter() - started) * 1000)
                        assert response.status_code == 200
                        assert 0 < len(response.json()["items"]) <= 20
                        assert response.headers["cache-control"] == "private, no-store"
                    # First request retained separately, not hidden in warm statistics.
                    warm = samples[1:]
                    measurements.append(
                        dict(
                            query={k: v for k, v in params.items() if k != "q"},
                            query_kind="exact"
                            if "04999" in str(params)
                            else "substring",
                            total=response.json()["total"],
                            first_ms=samples[0],
                            median_ms=statistics.median(warm),
                            maximum_ms=max(warm),
                            samples_ms=warm,
                        )
                    )
                with db.transaction() as session:
                    plan = session.execute(
                        text(
                            "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id "
                            "FROM song_catalog WHERE status='published' "
                            "AND language='ur' AND search_text LIKE :query "
                            "ORDER BY identity_key"
                        ),
                        {"query": "%" + normalize(prefix) + "%"},
                    ).scalar_one()
                output = dict(
                    measured_at=datetime.now(UTC).isoformat(),
                    environment=(
                        "disposable PostgreSQL; in-process real FastAPI/auth/SQL"
                    ),
                    python=platform.python_version(),
                    synthetic_records=len(identifiers),
                    assets=(
                        "original exercises duplicated only inside disposable test DB"
                    ),
                    measurements=measurements,
                    query_plan=plan,
                )
                destination = Path(__file__).parents[2] / ".artifacts"
                destination.mkdir(exist_ok=True)
                (destination / "phase18-search.json").write_text(
                    json.dumps(output, indent=2), encoding="utf-8"
                )
                print(json.dumps(measurements, indent=2))
                assert all(
                    max(item["samples_ms"] + [item["first_ms"]]) < 5000
                    for item in measurements
                ), "Disposable API search exceeded 5s budget; measurements preserved"
    finally:
        with db.transaction() as session:
            session.execute(
                delete(SongReference).where(SongReference.id.in_(identifiers))
            )
            if account:
                session.execute(
                    delete(AccountRecord).where(AccountRecord.id == account)
                )
        db.close()
        media.cleanup()


if __name__ == "__main__":
    main()
