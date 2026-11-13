from pathlib import Path

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.modules.identity.adapters import Delivery
from app.modules.identity.domain import IdentityError


def test_production_requires_explicit_email_opt_out() -> None:
    with pytest.raises(ValidationError):
        Settings(environment="production", trusted_origins=["https://app.example.com"])
    Settings(
        environment="production",
        trusted_origins=["https://app.example.com"],
        email_enabled=False,
    )


def test_disabled_email_does_not_capture_tokens(tmp_path: Path) -> None:
    delivery = Delivery(Settings(email_enabled=False, mail_directory=str(tmp_path)))
    with pytest.raises(IdentityError) as caught:
        delivery.send("learner@example.com", "verify", "private-test-token")
    assert caught.value.status == 503
    assert caught.value.code == "email_unavailable"
    assert not list(tmp_path.iterdir())
    assert delivery.purge_expired() == 0
    delivery.forget("learner@example.com")


def test_disabled_email_blocks_requests_without_account_lookup() -> None:
    from types import SimpleNamespace

    from app.modules.identity.routes import require_email

    request = SimpleNamespace(
        app=SimpleNamespace(
            state=SimpleNamespace(settings=Settings(email_enabled=False))
        )
    )
    with pytest.raises(IdentityError) as caught:
        require_email(request)
    assert caught.value.code == "email_unavailable"
