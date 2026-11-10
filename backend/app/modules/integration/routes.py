from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.modules.identity.domain import Actor
from app.modules.identity.routes import current, service
from app.modules.identity.service import IdentityService
from app.modules.integration.schemas import (
    AssessmentInput,
    AssessmentView,
    ReminderDue,
    ReminderInput,
    ReminderView,
    Suggestion,
)
from app.modules.integration.service import Integration

router = APIRouter(prefix="/api/v1/integration", tags=["integration"])
A = Annotated[Actor, Depends(current)]
S = Annotated[IdentityService, Depends(service)]


@router.get("/assessments", response_model=list[AssessmentView])
def assessments(
    actor: A, svc: S, offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)
) -> list[AssessmentView]:
    return Integration(svc.db).assessments(actor.id, offset, limit)


@router.post("/assessments", response_model=AssessmentView, status_code=201)
def assess(data: AssessmentInput, actor: A, svc: S) -> AssessmentView:
    return Integration(svc.db).save_assessment(actor.id, data)


@router.delete("/assessments/{identifier}", status_code=204)
def delete(identifier: UUID, actor: A, svc: S) -> None:
    Integration(svc.db).delete_assessment(actor.id, identifier)


@router.get("/reminder", response_model=ReminderView)
def reminder(actor: A, svc: S) -> ReminderView:
    return Integration(svc.db).reminder(actor.id)


@router.put("/reminder", response_model=ReminderView)
def update(data: ReminderInput, actor: A, svc: S) -> ReminderView:
    return Integration(svc.db).update_reminder(actor.id, data)


@router.post("/reminder/check", response_model=ReminderDue)
def check(actor: A, svc: S) -> ReminderDue:
    return Integration(svc.db).check_reminder(actor.id)


@router.get("/suggestion", response_model=Suggestion)
def suggest(actor: A, svc: S) -> Suggestion:
    return Integration(svc.db).suggestion(actor.id)
