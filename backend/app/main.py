import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException

from app.core.config import Settings
from app.core.contracts import ErrorResponse
from app.core.database import Database
from app.core.logging import configure_logging
from app.modules.identity.adapters import ArgonPasswords, Delivery
from app.modules.identity.domain import IdentityError
from app.modules.identity.routes import router as identity_router
from app.modules.identity.service import IdentityService
from app.modules.security.maintenance import sweep
from app.modules.security.middleware import BodyLimit


class Health(BaseModel):
    status: str


def create_app(settings: Settings | None = None) -> FastAPI:
    config = settings or Settings()
    logger = configure_logging(config.log_level)
    database = (
        Database(config.database_url.get_secret_value())
        if config.database_url
        else None
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        cleanup: asyncio.Task[None] | None = None

        def clean_expired() -> None:
            if database:
                sweep(database, datetime.now(UTC))
                Delivery(config).purge_expired()

        async def maintain() -> None:
            while True:
                await asyncio.sleep(900)
                try:
                    await asyncio.to_thread(clean_expired)
                except Exception:
                    logger.warning(
                        "security_cleanup_failed",
                        extra={"event": "security_cleanup_failed"},
                    )

        try:
            if database and config.environment == "production":
                database.require_runtime_privileges()
            if database:
                try:
                    await asyncio.to_thread(clean_expired)
                except Exception:
                    logger.warning(
                        "security_cleanup_failed",
                        extra={"event": "security_cleanup_failed"},
                    )
                cleanup = asyncio.create_task(maintain())
            yield
        finally:
            if cleanup:
                cleanup.cancel()
                with suppress(asyncio.CancelledError):
                    await cleanup
            if database:
                database.close()

    app = FastAPI(
        title="Chord House API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None if config.environment == "production" else "/docs",
        redoc_url=None if config.environment == "production" else "/redoc",
        openapi_url=None if config.environment == "production" else "/openapi.json",
        responses={422: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    )
    app.state.database = database
    app.add_middleware(BodyLimit)
    app.state.settings = config
    app.state.identity = (
        IdentityService(database, ArgonPasswords(), Delivery(config))
        if database
        else None
    )
    app.include_router(identity_router)
    from app.modules.security.routes import router as security_router

    app.include_router(security_router)
    from app.modules.integration.routes import router as integration_router

    app.include_router(integration_router)
    from app.modules.personal_workspace.routes import router as workspace_router

    app.include_router(workspace_router)
    from app.modules.catalog.chord_routes import router as chord_router

    app.include_router(chord_router)
    from app.modules.catalog.pattern_routes import router as pattern_router

    app.include_router(pattern_router)
    from app.modules.catalog.song_routes import router as song_router

    app.include_router(song_router)
    from app.modules.practice.routes import router as practice_router

    app.include_router(practice_router)
    from app.modules.content_management.routes import router as content_router

    app.include_router(content_router)

    def error(
        request: Request,
        status: int,
        code: str,
        message: str,
        fields: list[dict[str, str]] | None = None,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status,
            content={
                "error": {
                    "code": code,
                    "message": message,
                    "request_id": request.state.request_id,
                    "fields": fields or [],
                }
            },
            headers={"X-Request-ID": request.state.request_id}
            | ({"Retry-After": "900"} if status == 429 else {}),
        )

    @app.middleware("http")
    async def request_context(request: Request, call_next: Any) -> Any:
        request.state.request_id = str(uuid4())
        try:
            if config.environment == "production" and request.url.scheme != "https":
                response = error(request, 400, "https_required", "HTTPS is required")
            else:
                response = await call_next(request)
        except Exception as exc:
            logger.error(
                "request_failed",
                extra={
                    "event": "request_failed",
                    "request_id": request.state.request_id,
                    "status": 500,
                    "exception_type": type(exc).__name__,
                },
            )
            response = error(
                request, 500, "internal_error", "An unexpected error occurred"
            )
        if request.url.path.startswith("/api/v1"):
            response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        if config.environment == "production" and request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000"
        response.headers["X-Request-ID"] = request.state.request_id
        logger.info(
            "request_complete",
            extra={
                "event": "request_complete",
                "request_id": request.state.request_id,
                "status": response.status_code,
            },
        )
        return response

    @app.exception_handler(IdentityError)
    async def identity_error(request: Request, exc: IdentityError) -> JSONResponse:
        return error(request, exc.status, exc.code, exc.message)

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
        response = error(
            request, exc.status_code, "http_error", "Request could not be completed"
        )
        # Preserve protocol headers (e.g. Allow, WWW-Authenticate) but not details.
        if exc.headers:
            response.headers.update(exc.headers)
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        fields = [
            {"field": ".".join(str(part) for part in item["loc"]), "code": item["type"]}
            for item in exc.errors()
        ]
        return error(
            request, 422, "validation_error", "Check the submitted fields", fields
        )

    @app.get("/api/v1/health/live", response_model=Health, tags=["health"])
    def live() -> Health:
        return Health(status="ok")

    @app.get(
        "/api/v1/health/ready",
        response_model=Health,
        tags=["health"],
        responses={503: {"model": ErrorResponse}},
    )
    def ready(request: Request) -> Health | JSONResponse:
        if database is None:
            return error(request, 503, "not_ready", "Database is not configured")
        try:
            database.ping()
        except Exception:
            logger.warning(
                "database_unavailable",
                extra={
                    "event": "database_unavailable",
                    "request_id": request.state.request_id,
                    "status": 503,
                },
            )
            return error(request, 503, "not_ready", "Database is unavailable")
        return Health(status="ready")

    return app


app = create_app()
