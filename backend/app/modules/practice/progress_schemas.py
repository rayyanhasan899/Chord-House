from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MilestoneView(BaseModel):
    code: str
    level: str
    title: str
    instruction: str
    tool: str
    completed_at: datetime | None


class RoadmapView(BaseModel):
    instrument: str
    skill: str
    milestones: list[MilestoneView]


class CompletionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    instrument: Literal["acoustic_guitar", "electric_guitar", "bass", "ukulele"]
    completed: bool


class DayView(BaseModel):
    day: str
    seconds: float
    goal_minutes: int | None
    goal_met: bool | None


class Ranking(BaseModel):
    label: str
    seconds: float


class GoalProgress(BaseModel):
    period: str
    minutes: int
    paused: bool
    seconds: float
    percent: float


class ReviewView(BaseModel):
    week: str
    end: str
    seconds: float
    practice_days: int
    achieved_daily_goals: int
    evaluated_daily_goals: int
    weekly_goal_met: bool | None
    improvement: str
    version: int


class ProgressView(BaseModel):
    timezone: str
    as_of: datetime
    today: str
    week: str
    month: str
    total_seconds: float
    today_seconds: float
    week_seconds: float
    month_seconds: float
    saved_sessions: int
    current_streak: int
    longest_streak: int
    days: list[DayView]
    goals: list[GoalProgress]
    instruments: list[Ranking]
    songs: list[Ranking]
    chords: list[Ranking]
    review: ReviewView


class ReviewInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    improvement: str = Field(max_length=2000)
    version: int = Field(ge=0, strict=True)
