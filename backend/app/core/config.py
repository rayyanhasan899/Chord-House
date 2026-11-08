from typing import Literal

from pydantic import SecretStr, field_validator
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
