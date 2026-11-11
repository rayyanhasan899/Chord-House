from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CHORD_", extra="ignore", hide_input_in_errors=True
    )
    environment: Literal["development", "test", "production"] = "development"
    database_url: SecretStr | None = None
    database_url_unpooled: SecretStr | None = None
    log_level: Literal["INFO", "WARNING", "ERROR", "DEBUG"] = "INFO"

    trusted_origins: list[str] = [
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
    ]
    auth_limit: int = Field(default=30, ge=1, le=1000)
    mail_directory: str = ".local-mail"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: SecretStr | None = None
    mail_from: str = "chord-house@localhost"

    @model_validator(mode="after")
    def production_mail(self) -> Settings:
        for origin in self.trusted_origins:
            parsed = urlsplit(origin)
            if (
                parsed.scheme not in ("http", "https")
                or not parsed.hostname
                or parsed.username
                or parsed.password
                or parsed.path
                or parsed.query
                or parsed.fragment
                or "*" in origin
            ):
                raise ValueError("Trusted origins must be exact HTTP(S) origins")
        if self.environment == "production":
            if (
                not self.smtp_host
                or not self.trusted_origins
                or not all(
                    origin.startswith("https://") for origin in self.trusted_origins
                )
            ):
                raise ValueError(
                    "Production requires SMTP and explicit HTTPS trusted origins"
                )
        return self

    @field_validator("database_url", "database_url_unpooled")
    @classmethod
    def postgres_only(cls, value: SecretStr | None) -> SecretStr | None:
        if value is not None:
            try:
                url = make_url(value.get_secret_value())
                if url.drivername != "postgresql+psycopg":
                    raise ValueError
            except Exception:
                raise ValueError(
                    "Use a valid postgresql+psycopg connection URL"
                ) from None
        return value
