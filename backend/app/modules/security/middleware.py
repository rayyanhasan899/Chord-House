from uuid import uuid4

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

MAX_BODY_BYTES = 8 * 1024 * 1024


class BodyLimitExceeded(Exception):
    pass


class BodyLimit:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        count = 0

        async def bounded_receive() -> Message:
            nonlocal count
            message = await receive()
            if message["type"] == "http.request":
                count += len(message.get("body", b""))
                if count > MAX_BODY_BYTES:
                    raise BodyLimitExceeded
            return message

        headers = dict(scope["headers"])
        invalid = False
        try:
            declared = int(headers.get(b"content-length", b"0"))
            if declared < 0:
                raise ValueError
        except ValueError:
            invalid = True
            declared = 0
        try:
            if invalid:
                raise BodyLimitExceeded
            if declared > MAX_BODY_BYTES:
                raise BodyLimitExceeded
            await self.app(scope, bounded_receive, send)
        except BodyLimitExceeded:
            status = 400 if invalid else 413
            response = JSONResponse(
                {
                    "error": {
                        "code": "request_body_rejected",
                        "message": "Request body is invalid or exceeds 8 MiB",
                        "request_id": scope.get("state", {}).get(
                            "request_id", str(uuid4())
                        ),
                        "fields": [],
                    }
                },
                status_code=status,
            )
            await response(scope, receive, send)
