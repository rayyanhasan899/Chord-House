from datetime import UTC, datetime
from uuid import UUID

from app.modules.identity.domain import IdentityError, Passwords
from app.modules.security.contracts import ExportSource
from app.modules.security.schemas import PersonalExport


def personal_export(
    source: ExportSource,
    passwords: Passwords,
    owner: UUID,
    password: str,
    confirm: bool,
) -> PersonalExport:
    if not confirm:
        raise IdentityError(
            403,
            "verification_failed",
            "Confirm the export and enter your current password",
        )
    try:
        snapshot = source.read(
            owner, lambda encoded: bool(encoded and passwords.verify(encoded, password))
        )
    except PermissionError:
        raise IdentityError(
            403,
            "verification_failed",
            "Confirm the export and enter your current password",
        ) from None
    if snapshot is None:
        raise IdentityError(401, "authentication_required", "Please sign in")
    return PersonalExport.model_validate(
        dict(
            exported_at=datetime.now(UTC),
            profile=snapshot.profile,
            records=snapshot.records,
            exclusions=[
                "Password hashes, session/CSRF tokens, email codes and "
                "security retry/rate-limit keys.",
                "Deleted assessment payloads and shared/licensed catalog content, "
                "supplier packs and other users' data.",
                "Practice totals are derived from saved sessions; running durations "
                "are the persisted snapshot at export time.",
            ],
        )
    )
