"""Disposable-test-only restricted database principal."""

from contextlib import contextmanager
from uuid import uuid4

from app.core.database import Database


@contextmanager
def runtime_database(admin):
    from psycopg import sql

    role, password = "security_test_" + uuid4().hex, uuid4().hex
    with admin.engine.begin() as connection:
        connection.exec_driver_sql(
            sql.SQL(
                "CREATE ROLE {} LOGIN PASSWORD {} NOSUPERUSER NOCREATEDB "
                "NOCREATEROLE NOREPLICATION NOBYPASSRLS"
            )
            .format(sql.Identifier(role), sql.Literal(password))
            .as_string()
        )
        connection.exec_driver_sql(
            sql.SQL("GRANT USAGE ON SCHEMA public TO {}")
            .format(sql.Identifier(role))
            .as_string()
        )
        connection.exec_driver_sql(
            sql.SQL(
                "GRANT SELECT, INSERT, UPDATE, DELETE "
                "ON ALL TABLES IN SCHEMA public TO {}"
            )
            .format(sql.Identifier(role))
            .as_string()
        )
    runtime = Database(
        admin.engine.url.set(username=role, password=password).render_as_string(
            hide_password=False
        )
    )
    try:
        yield runtime
    finally:
        runtime.close()
        with admin.engine.begin() as connection:
            connection.exec_driver_sql(
                sql.SQL("DROP OWNED BY {}").format(sql.Identifier(role)).as_string()
            )
            connection.exec_driver_sql(
                sql.SQL("DROP ROLE {}").format(sql.Identifier(role)).as_string()
            )
