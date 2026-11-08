import json
import logging


class SafeJsonFormatter(logging.Formatter):
    """Allowlist fields; omit arbitrary messages, exceptions and request inputs."""

    def format(self, record: logging.LogRecord) -> str:
        return json.dumps(
            {
                "level": record.levelname,
                "event": getattr(record, "event", "application_event"),
                "request_id": getattr(record, "request_id", None),
                "status": getattr(record, "status", None),
                "exception_type": getattr(record, "exception_type", None),
            }
        )


def configure_logging(level: str) -> logging.Logger:
    logging.getLogger("uvicorn.access").disabled = True
    logger = logging.getLogger("chord_house")
    logger.setLevel(level)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(SafeJsonFormatter())
        logger.addHandler(handler)
    logger.propagate = False
    return logger
