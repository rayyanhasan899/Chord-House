from datetime import datetime
from typing import Literal

from pydantic import BaseModel, JsonValue


class PersonalExport(BaseModel):
    format: Literal["chord-house.personal-data.v1"] = "chord-house.personal-data.v1"
    exported_at: datetime
    profile: dict[str, JsonValue]
    records: dict[str, list[dict[str, JsonValue]]]
    exclusions: list[str]
