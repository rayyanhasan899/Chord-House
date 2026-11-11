from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Instrument = Literal["acoustic_guitar", "electric_guitar", "bass", "ukulele"]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)


class Credentials(Input):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class Registration(Credentials):
    display_name: str = Field(min_length=1, max_length=80)
    acknowledge_privacy: bool

    @field_validator("display_name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Display name is required")
        return value.strip()


class ProfileUpdate(Input):
    display_name: str = Field(min_length=1, max_length=80)
    instrument: Instrument
    skill: Literal["beginner", "intermediate", "advanced"]
    timezone: str = Field(max_length=100)
    theme: Literal["system", "light", "dark"] = "system"
    handedness: Literal["right", "left"] = "right"
    tuning: str = Field(default="standard", max_length=40)
    chord_display: Literal["diagrams", "fretboard"] = "diagrams"
    interests: str = Field(default="", max_length=500)
    onboarding_complete: bool = True

    @field_validator("display_name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Display name is required")
        return value.strip()

    @field_validator("timezone")
    @classmethod
    def valid_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError, ValueError:
            raise ValueError("Use a valid IANA timezone") from None
        return value


class EmailInput(Input):
    email: EmailStr


class TokenInput(Input):
    token: str = Field(min_length=40, max_length=100)


class ResetInput(TokenInput):
    password: str = Field(min_length=12, max_length=128)


class PasswordChange(Input):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class SensitiveInput(Input):
    current_password: str = Field(min_length=1, max_length=128)
    confirm: bool = Field(default=False, strict=True)


class Message(BaseModel):
    message: str


class Profile(BaseModel):
    id: str
    email: str | None
    display_name: str
    instrument: Instrument
    skill: Literal["beginner", "intermediate", "advanced"]
    timezone: str
    theme: Literal["system", "light", "dark"]
    handedness: Literal["right", "left"]
    tuning: str
    chord_display: Literal["diagrams", "fretboard"]
    interests: str
    onboarding_complete: bool
    email_verified: bool
    role: str
    csrf_token: str
