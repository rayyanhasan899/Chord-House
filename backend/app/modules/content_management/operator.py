"""Explicit local operator role provisioning; never available through HTTP."""

import argparse
from uuid import UUID

from app.core.config import Settings
from app.core.database import Database
from app.modules.content_management.models import audit
from app.modules.identity.models import AccountRecord


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Assign a role to an explicitly identified existing account"
    )
    parser.add_argument("account_id", type=UUID)
    parser.add_argument("role", choices=["user", "content_manager", "admin"])
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Confirm local operator authority for this role change",
    )
    args = parser.parse_args()
    if not args.confirm:
        parser.error("Review the account ID and role, then pass --confirm")
    settings = Settings()
    if not settings.database_url:
        parser.error("Configure CHORD_DATABASE_URL")
    assert settings.database_url
    database = Database(settings.database_url.get_secret_value())
    try:
        with database.transaction() as session:
            account = session.get(AccountRecord, args.account_id, with_for_update=True)
            if account is None:
                parser.error("Account not found")
            if args.role != "user" and not account.email_verified:
                parser.error(
                    "Verify this account's email before granting a privileged role"
                )
            account.role = args.role
            audit(
                session, None, "account", str(account.id), "operator:role:" + args.role
            )
        print("Role updated. Refresh the account session to see navigation changes.")
    finally:
        database.close()


if __name__ == "__main__":
    main()
