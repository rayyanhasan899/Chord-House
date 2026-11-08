from pydantic import BaseModel


class FieldError(BaseModel):
    field: str
    code: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str
    fields: list[FieldError] = []


class ErrorResponse(BaseModel):
    error: ErrorDetail
