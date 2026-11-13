import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from app.core.contracts import ErrorResponse
from app.modules.identity.domain import Actor, IdentityError
from app.modules.identity.schemas import (
    Credentials,
    EmailInput,
    Message,
    PasswordChange,
    Profile,
    ProfileUpdate,
    Registration,
    ResetInput,
    SensitiveInput,
    TokenInput,
)
from app.modules.identity.service import IdentityService

router = APIRouter(
    prefix="/api/v1",
    tags=["identity"],
    responses={
        status: {"model": ErrorResponse}
        for status in (400, 401, 403, 409, 422, 429, 503)
    },
)
COOKIE = "chord_session"


def cookie_name(request: Request) -> str:
    return (
        "__Host-chord_session"
        if request.app.state.settings.environment == "production"
        else COOKIE
    )


def clear_cookie(request: Request, response: Response) -> None:
    response.delete_cookie(
        cookie_name(request),
        path="/",
        secure=request.app.state.settings.environment == "production",
        httponly=True,
        samesite="lax",
    )


def service(request: Request) -> IdentityService:
    result: IdentityService | None = request.app.state.identity
    if result is None:
        raise IdentityError(503, "not_ready", "Database is not configured")
    return result


def origin(request: Request) -> None:
    if request.headers.get("origin") not in request.app.state.settings.trusted_origins:
        raise IdentityError(403, "origin_rejected", "Request origin is not allowed")


def current(
    request: Request, svc: Annotated[IdentityService, Depends(service)]
) -> Actor:
    actor = svc.actor(request.cookies.get(cookie_name(request)))
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        origin(request)
        svc.throttle(
            "session:" + actor.session_hash, request.app.state.settings.auth_limit
        )
        if not secrets.compare_digest(
            request.headers.get("x-csrf-token", "").encode(), actor.csrf.encode()
        ):
            raise IdentityError(403, "csrf_rejected", "Refresh the page and try again")
    return actor


def guard(request: Request, svc: IdentityService, email: str = "") -> None:
    origin(request)
    address = request.client.host if request.client else "unknown"
    svc.throttle("ip:" + address, request.app.state.settings.auth_limit)
    if email:
        svc.throttle("email:" + email.casefold(), request.app.state.settings.auth_limit)


def require_email(request: Request) -> None:
    if not request.app.state.settings.email_enabled:
        raise IdentityError(
            503,
            "email_unavailable",
            "Email delivery is temporarily disabled. "
            "Email verification and recovery are unavailable.",
        )


@router.post("/auth/register", response_model=Message, status_code=201)
def register(
    data: Registration,
    request: Request,
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    guard(request, svc, str(data.email))
    enabled = request.app.state.settings.email_enabled
    svc.register(data, send_verification=enabled)
    return Message(
        message=(
            "Account created. Check your email to verify ownership."
            if enabled
            else "Account created. Email verification is temporarily unavailable."
        )
    )


@router.post("/auth/login", response_model=Profile)
def login(
    data: Credentials,
    request: Request,
    response: Response,
    svc: Annotated[IdentityService, Depends(service)],
) -> Profile:
    guard(request, svc, str(data.email))
    token = svc.login(
        str(data.email), data.password, request.cookies.get(cookie_name(request))
    )
    response.set_cookie(
        cookie_name(request),
        token,
        httponly=True,
        secure=request.app.state.settings.environment == "production",
        samesite="lax",
        max_age=604800,
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"
    return svc.profile(svc.actor(token))


@router.get("/me", response_model=Profile)
def me(
    response: Response,
    actor: Annotated[Actor, Depends(current)],
    svc: Annotated[IdentityService, Depends(service)],
) -> Profile:
    response.headers["Cache-Control"] = "no-store"
    return svc.profile(actor)


@router.patch("/me", response_model=Profile)
def update(
    data: ProfileUpdate,
    actor: Annotated[Actor, Depends(current)],
    svc: Annotated[IdentityService, Depends(service)],
) -> Profile:
    return svc.update(actor, data)


@router.post("/auth/logout", response_model=Message)
def logout(
    request: Request,
    response: Response,
    actor: Annotated[Actor, Depends(current)],
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    svc.logout(actor)
    clear_cookie(request, response)
    return Message(message="Signed out")


@router.post("/auth/password", response_model=Message)
def password(
    request: Request,
    data: PasswordChange,
    response: Response,
    actor: Annotated[Actor, Depends(current)],
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    svc.change_password(actor, data.current_password, data.new_password)
    clear_cookie(request, response)
    return Message(message="Password changed. Sign in again.")


@router.post("/auth/reset/request", response_model=Message)
def reset_request(
    data: EmailInput,
    request: Request,
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    guard(request, svc, str(data.email))
    require_email(request)
    svc.request_token(str(data.email), "reset")
    return Message(message="If eligible, a code has been sent.")


@router.post("/auth/reset/confirm", response_model=Message)
def reset_confirm(
    data: ResetInput,
    request: Request,
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    guard(request, svc)
    svc.consume(data.token, "reset", data.password)
    return Message(message="Password reset. Sign in again.")


@router.post("/auth/verify/request", response_model=Message)
def verify_request(
    data: EmailInput,
    request: Request,
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    guard(request, svc, str(data.email))
    require_email(request)
    svc.request_token(str(data.email), "verify")
    return Message(message="If eligible, a code has been sent.")


@router.post("/auth/verify/confirm", response_model=Message)
def verify(
    data: TokenInput,
    request: Request,
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    guard(request, svc)
    svc.consume(data.token, "verify")
    return Message(message="Email verified")


@router.post("/me/delete", response_model=Message)
def remove(
    request: Request,
    data: SensitiveInput,
    response: Response,
    actor: Annotated[Actor, Depends(current)],
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    svc.throttle("personal-deletion:" + str(actor.id), 5)
    svc.delete_account(actor, data.current_password, data.confirm)
    clear_cookie(request, response)
    return Message(message="Account deleted")


@router.get("/admin/access", response_model=Message)
def admin(actor: Annotated[Actor, Depends(current)]) -> Message:
    if actor.role not in ("admin", "content_manager"):
        raise IdentityError(403, "forbidden", "Administrator access required")
    return Message(message="Content manager access granted")
