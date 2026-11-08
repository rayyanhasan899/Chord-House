from alembic import context
from sqlalchemy import create_engine, pool

from app.core import models  # noqa: F401
from app.core.config import Settings
from app.core.database import Base

settings = Settings()
secret = settings.database_url_unpooled or settings.database_url
if secret is None:
    raise RuntimeError("Configure CHORD_DATABASE_URL before running migrations")
url = secret.get_secret_value()
if context.is_offline_mode():
    context.configure(url=url, target_metadata=Base.metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    engine = create_engine(url, poolclass=pool.NullPool, hide_parameters=True)
    try:
        with engine.connect() as connection:
            context.configure(
                connection=connection, target_metadata=Base.metadata, compare_type=True
            )
            with context.begin_transaction():
                context.run_migrations()
    finally:
        engine.dispose()
