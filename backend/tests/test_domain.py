from uuid import uuid4

import pytest

from app.modules.catalog.domain import Tuning
from app.modules.personal_workspace.domain import LearningNote


@pytest.mark.parametrize(
    "pitches", [(40,), (40, 45, 50, 55, 59, 128), (40, 45, 50, 55, 59, True)]
)
def test_invalid_tuning(pitches: tuple[int, ...]) -> None:
    with pytest.raises(ValueError):
        Tuning("bad", "acoustic_guitar", pitches)


def test_reference_frequencies_preserve_reentrant_order() -> None:
    tuning = Tuning("ukulele:reentrant", "ukulele", (67, 60, 64, 69))
    assert tuning.frequencies() == pytest.approx((392, 261.63, 329.63, 440), abs=0.01)
    assert Tuning("bass:standard", "bass", (28, 33, 38, 43)).frequencies()[
        0
    ] == pytest.approx(41.20344, abs=0.0001)
    with pytest.raises(ValueError):
        tuning.frequencies(float("nan"))


@pytest.mark.parametrize("body", ["", "   ", "a" * 10001])
def test_note_validation(body: str) -> None:
    with pytest.raises(ValueError):
        LearningNote(uuid4(), uuid4(), body)


def test_domain_is_framework_independent() -> None:
    import ast
    from pathlib import Path

    for path in (Path(__file__).parents[1] / "app/modules").glob("*/domain.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, ast.ImportFrom):
                assert not (node.module or "").startswith(
                    ("fastapi", "sqlalchemy", "pydantic", "app.core")
                )
            if isinstance(node, ast.Import):
                assert all(
                    not alias.name.startswith(("fastapi", "sqlalchemy", "pydantic"))
                    for alias in node.names
                )


def test_session_idle_and_absolute_expiry() -> None:
    from datetime import UTC, datetime, timedelta

    from app.modules.identity.domain import session_valid

    now = datetime.now(UTC)
    assert session_valid(now, now - timedelta(hours=1), now + timedelta(days=1))
    assert not session_valid(now, now - timedelta(days=1), now + timedelta(days=1))
    assert not session_valid(now, now, now)
    assert not session_valid(now, now + timedelta(seconds=1), now + timedelta(days=1))
