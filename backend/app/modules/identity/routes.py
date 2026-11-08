import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

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

router = APIRouter(prefix="/api/v1", tags=["identity"])
COOKIE = "chord_session"


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
    actor = svc.actor(request.cookies.get(COOKIE))
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


@router.post("/auth/register", response_model=Message, status_code=201)
def register(
    data: Registration,
    request: Request,
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    guard(request, svc, str(data.email))
    svc.register(data)
    return Message(message="Account created. Check your email to verify ownership.")


@router.post("/auth/login", response_model=Profile)
def login(
    data: Credentials,
    request: Request,
    response: Response,
    svc: Annotated[IdentityService, Depends(service)],
) -> Profile:
    guard(request, svc, str(data.email))
    token = svc.login(str(data.email), data.password, request.cookies.get(COOKIE))
    response.set_cookie(
        COOKIE,
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
    response: Response,
    actor: Annotated[Actor, Depends(current)],
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    svc.logout(actor)
    response.delete_cookie(COOKIE, path="/")
    return Message(message="Signed out")


@router.post("/auth/password", response_model=Message)
def password(
    data: PasswordChange,
    response: Response,
    actor: Annotated[Actor, Depends(current)],
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    svc.change_password(actor, data.current_password, data.new_password)
    response.delete_cookie(COOKIE, path="/")
    return Message(message="Password changed. Sign in again.")


@router.post("/auth/reset/request", response_model=Message)
def reset_request(
    data: EmailInput,
    request: Request,
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    guard(request, svc, str(data.email))
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
    data: SensitiveInput,
    response: Response,
    actor: Annotated[Actor, Depends(current)],
    svc: Annotated[IdentityService, Depends(service)],
) -> Message:
    svc.delete_account(actor, data.current_password, data.confirm)
    response.delete_cookie(COOKIE, path="/")
    return Message(message="Account deleted")


@router.get("/admin/access", response_model=Message)
def admin(actor: Annotated[Actor, Depends(current)]) -> Message:
    if actor.role not in ("admin", "content_manager"):
        raise IdentityError(403, "forbidden", "Administrator access required")
    return Message(message="Content manager access granted")
