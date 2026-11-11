from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from app.modules.security.domain import ExportValue


@dataclass(frozen=True)
class ExportSnapshot:
    profile: dict[str, ExportValue]
    records: dict[str, list[dict[str, ExportValue]]]


class ExportSource(Protocol):
    def read(
        self, owner: UUID, authorize: Callable[[str | None], bool]
    ) -> ExportSnapshot | None: ...
