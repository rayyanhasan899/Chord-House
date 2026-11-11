from datetime import date, datetime
from uuid import UUID

type ExportValue = (
    None | str | bool | int | float | list[ExportValue] | dict[str, ExportValue]
)


def export_value(value: object) -> ExportValue:
    """Convert explicitly selected fields only, never introspect an account ORM row."""
    if value is None or isinstance(value, str | int | float | bool):
        return value
    if isinstance(value, datetime | date):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, list):
        return [export_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): export_value(item) for key, item in value.items()}
    raise TypeError("Unsupported personal export value")
