from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.modules.identity.domain import Actor
from app.modules.identity.routes import current, service
from app.modules.identity.schemas import SensitiveInput
from app.modules.identity.service import IdentityService
from app.modules.security.schemas import PersonalExport
from app.modules.security.service import personal_export

router = APIRouter(prefix="/api/v1/me", tags=["privacy"])


@router.post("/export", response_model=PersonalExport)
def export(
    data: SensitiveInput,
    response: Response,
    actor: Annotated[Actor, Depends(current)],
    svc: Annotated[IdentityService, Depends(service)],
) -> PersonalExport:
    svc.throttle("personal-export:" + str(actor.id), 5)
    response.headers["Content-Disposition"] = (
        'attachment; filename="chord-house-personal-data.json"'
    )
    return personal_export(svc, actor, data.current_password, data.confirm)
