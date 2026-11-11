"""Remove expired security records; never purge personal practice history."""

import argparse
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, or_

from app.core.config import Settings
from app.core.database import Database
from app.modules.identity.adapters import Delivery
from app.modules.identity.models import RateRecord, SessionRecord, TokenRecord


def sweep(db: Database, now: datetime) -> None:
    with db.transaction() as session:
        session.execute(delete(TokenRecord).where(TokenRecord.expires_at <= now))
        session.execute(delete(RateRecord).where(RateRecord.expires_at <= now))
        session.execute(
            delete(SessionRecord).where(
                or_(
                    SessionRecord.expires_at <= now,
                    SessionRecord.last_seen <= now - timedelta(days=1),
                )
            )
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--confirm", action="store_true", required=True)
    parser.parse_args()
    config = Settings()
    if not config.database_url:
        raise RuntimeError("Configure the target database explicitly")
    db = Database(config.database_url.get_secret_value())
    try:
        sweep(db, datetime.now(UTC))
        Delivery(config).purge_expired()
        print("Expired sessions, codes, rate windows and local captured codes cleaned.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
