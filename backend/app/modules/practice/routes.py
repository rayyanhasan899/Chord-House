from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.modules.identity.domain import Actor
from app.modules.identity.routes import current, service
from app.modules.identity.service import IdentityService
from app.modules.practice.schemas import (
    Command,
    Duplicate,
    GoalInput,
    GoalView,
    RoutineCreate,
    RoutineUpdate,
    RoutineView,
    SessionStart,
    SessionUpdate,
    SessionView,
)
from app.modules.practice.service import Practice

router = APIRouter(prefix="/api/v1/practice", tags=["practice"])
A = Annotated[Actor, Depends(current)]
S = Annotated[IdentityService, Depends(service)]


@router.get("/current", response_model=SessionView | None)
def active(actor: A, svc: S) -> SessionView | None:
    return Practice(svc.db).current(actor.id)


@router.post("/sessions", response_model=SessionView, status_code=201)
def start(data: SessionStart, actor: A, svc: S) -> SessionView:
    return Practice(svc.db).start(actor.id, data)


@router.get("/sessions", response_model=list[SessionView])
def history(
    actor: A, svc: S, offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)
) -> list[SessionView]:
    return Practice(svc.db).history(actor.id, offset, limit)


@router.post("/sessions/{identifier}/{action}", response_model=SessionView)
def command(
    identifier: UUID,
    action: Literal["pause", "resume", "end", "save"],
    data: Command,
    actor: A,
    svc: S,
) -> SessionView:
    return Practice(svc.db).command(actor.id, identifier, action, data)


@router.put("/sessions/{identifier}", response_model=SessionView)
def update_session(
    identifier: UUID, data: SessionUpdate, actor: A, svc: S
) -> SessionView:
    return Practice(svc.db).update_session(actor.id, identifier, data)


@router.get("/sessions/{identifier}", response_model=SessionView)
def get_session(identifier: UUID, actor: A, svc: S) -> SessionView:
    return Practice(svc.db).get_session(actor.id, identifier)


@router.delete("/sessions/{identifier}", status_code=204)
def delete_session(
    identifier: UUID, actor: A, svc: S, version: int = Query(ge=1)
) -> None:
    Practice(svc.db).delete_session(actor.id, identifier, version)


@router.get("/routines", response_model=list[RoutineView])
def routines(
    actor: A, svc: S, offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)
) -> list[RoutineView]:
    return Practice(svc.db).list_routines(actor.id, offset, limit)


@router.post("/routines", response_model=RoutineView, status_code=201)
def create_routine(data: RoutineCreate, actor: A, svc: S) -> RoutineView:
    return Practice(svc.db).create_routine(actor.id, data)


@router.put("/routines/{identifier}", response_model=RoutineView)
def update_routine(
    identifier: UUID, data: RoutineUpdate, actor: A, svc: S
) -> RoutineView:
    return Practice(svc.db).update_routine(actor.id, identifier, data)


@router.get("/routines/{identifier}", response_model=RoutineView)
def get_routine(identifier: UUID, actor: A, svc: S) -> RoutineView:
    return Practice(svc.db).get_routine(actor.id, identifier)


@router.post(
    "/routines/{identifier}/duplicate", response_model=RoutineView, status_code=201
)
def duplicate_routine(
    identifier: UUID, data: Duplicate, actor: A, svc: S
) -> RoutineView:
    return Practice(svc.db).duplicate_routine(actor.id, identifier, data.client_key)


@router.delete("/routines/{identifier}", status_code=204)
def delete_routine(
    identifier: UUID, actor: A, svc: S, version: int = Query(ge=1)
) -> None:
    Practice(svc.db).delete_routine(actor.id, identifier, version)


@router.get("/goals", response_model=list[GoalView])
def goals(actor: A, svc: S) -> list[GoalView]:
    return Practice(svc.db).goals(actor.id)


@router.put("/goals/{period}", response_model=GoalView)
def goal(
    period: Literal["daily", "weekly"], data: GoalInput, actor: A, svc: S
) -> GoalView:
    return Practice(svc.db).goal(actor.id, period, data)
