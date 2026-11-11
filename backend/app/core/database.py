from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import MetaData, create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


class Database:
    def __init__(self, url: str) -> None:
        self.engine: Engine = create_engine(
            url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=5,
            pool_timeout=5,
            hide_parameters=True,
            connect_args={"connect_timeout": 3, "options": "-c statement_timeout=3000"},
        )
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)

    @contextmanager
    def transaction(self) -> Iterator[Session]:
        with self.sessions.begin() as session:
            yield session

    def ping(self) -> None:
        with self.engine.connect() as connection:
            connection.execute(text("SELECT 1"))

    def close(self) -> None:
        self.engine.dispose()

    def require_runtime_privileges(self) -> None:
        with self.engine.connect() as connection:
            unsafe = connection.scalar(
                text(
                    "SELECT current_user <> session_user OR rolsuper OR rolcreatedb "
                    "OR rolcreaterole OR rolreplication "
                    "OR rolbypassrls OR EXISTS (SELECT 1 FROM pg_auth_members "
                    "WHERE member=r.oid) OR "
                    "has_schema_privilege(current_user,'public','CREATE') OR "
                    "has_database_privilege(current_user,current_database(),'CREATE') "
                    "OR EXISTS (SELECT 1 FROM pg_class c "
                    "JOIN pg_namespace n ON n.oid=c.relnamespace "
                    "WHERE n.nspname='public' AND c.relowner=r.oid) "
                    "OR EXISTS (SELECT 1 FROM pg_database d WHERE "
                    "d.datname=current_database() "
                    "AND d.datdba=r.oid) FROM pg_roles r WHERE r.rolname=current_user"
                )
            )
            if unsafe is not False:
                raise RuntimeError(
                    "Production requires a non-owner, non-privileged runtime "
                    "database role"
                )
