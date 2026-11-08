from concurrent.futures import ThreadPoolExecutor
from threading import Lock

import pytest
from argon2 import PasswordHasher
from argon2.exceptions import HashingError

from app.modules.identity.adapters import ArgonPasswords
from app.modules.identity.domain import IdentityError


def test_password_jobs_are_bounded_without_weakening_hashes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    passwords = ArgonPasswords()
    actual = PasswordHasher.hash
    lock = Lock()
    current = maximum = 0

    def measured(hasher: PasswordHasher, password: str) -> str:
        nonlocal current, maximum
        with lock:
            current += 1
            maximum = max(maximum, current)
        try:
            return actual(hasher, password)
        finally:
            with lock:
                current -= 1

    monkeypatch.setattr(PasswordHasher, "hash", measured)
    with ThreadPoolExecutor(max_workers=8) as pool:
        hashes = list(pool.map(passwords.hash, ["capacity test phrase"] * 8))
    assert maximum == 2
    assert all("m=65536,t=3,p=4" in h for h in hashes)
    assert all(passwords.verify(h, "capacity test phrase") for h in hashes)

    def unavailable(hasher: PasswordHasher, password: str) -> str:
        raise HashingError("private internal details")

    monkeypatch.setattr(PasswordHasher, "hash", unavailable)
    with pytest.raises(IdentityError) as failure:
        passwords.hash("capacity test phrase")
    assert failure.value.status == 503
    assert "private" not in failure.value.message
