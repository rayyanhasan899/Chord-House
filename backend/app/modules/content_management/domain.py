"""Framework-independent content policy."""

from app.modules.identity.domain import Actor, IdentityError


def require_manager(actor: Actor) -> None:
    if actor.role not in ("admin", "content_manager"):
        raise IdentityError(403, "forbidden", "Content manager access required")


def check_revision(actual: int, expected: int) -> None:
    if actual != expected:
        raise IdentityError(
            409, "revision_conflict", "Content changed; reload before editing"
        )
