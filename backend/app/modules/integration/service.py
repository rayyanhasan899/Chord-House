from collections.abc import Callable
from datetime import UTC, datetime
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.core.database import Database
from app.modules.catalog.songs import SongRecord, detail
from app.modules.identity.domain import IdentityError
from app.modules.identity.models import AccountRecord
from app.modules.integration.domain import reminder_due
from app.modules.integration.models import (
    AssessmentRecord,
    ReminderDeliveryRecord,
    ReminderRecord,
)
from app.modules.integration.schemas import (
    AssessmentInput,
    AssessmentView,
    ReminderDue,
    ReminderInput,
    ReminderView,
    Suggestion,
)
from app.modules.practice.models import GoalRecord, PracticeRecord
from app.modules.practice.schemas import ActivityInput
from app.modules.practice.service import Practice, fingerprint


class Integration:
    def __init__(self, db: Database, clock: Callable[[], datetime] | None = None):
        self.db = db
        self.clock = clock or (lambda: datetime.now(UTC))

    def save_assessment(self, owner: UUID, data: AssessmentInput) -> AssessmentView:
        with Practice(self.db).transaction(owner) as session:
            digest = fingerprint(data.model_dump(mode="json"))
            row = session.scalar(
                select(AssessmentRecord).where(
                    AssessmentRecord.owner_id == owner,
                    AssessmentRecord.client_key == data.client_key,
                )
            )
            if row:
                if row.fingerprint != digest:
                    raise IdentityError(
                        409,
                        "key_reused",
                        "Use a new key for different assessment details",
                    )
            else:
                row = AssessmentRecord(
                    id=uuid4(),
                    owner_id=owner,
                    client_key=data.client_key,
                    fingerprint=digest,
                    payload=data.model_dump(mode="json"),
                    created_at=self.clock(),
                )
                session.add(row)
                session.flush()
            if row.payload is None:
                raise IdentityError(
                    410,
                    "assessment_deleted",
                    "This assessment was deleted; use a new key",
                )
            return AssessmentView(**row.payload, id=row.id, created_at=row.created_at)

    def assessments(self, owner: UUID, offset: int, limit: int) -> list[AssessmentView]:
        with self.db.transaction() as session:
            return [
                AssessmentView(**row.payload, id=row.id, created_at=row.created_at)
                for row in session.scalars(
                    select(AssessmentRecord)
                    .where(
                        AssessmentRecord.owner_id == owner,
                        AssessmentRecord.payload.is_not(None),
                    )
                    .order_by(AssessmentRecord.created_at.desc(), AssessmentRecord.id)
                    .offset(offset)
                    .limit(limit)
                )
                if row.payload is not None
            ]

    def delete_assessment(self, owner: UUID, identifier: UUID) -> None:
        with Practice(self.db).transaction(owner) as session:
            row = session.scalar(
                select(AssessmentRecord).where(
                    AssessmentRecord.owner_id == owner,
                    AssessmentRecord.id == identifier,
                )
            )
            if row is None:
                raise IdentityError(404, "not_found", "Assessment not found")
            row.payload = None

    @staticmethod
    def reminder_view(row: ReminderRecord | None, timezone: str) -> ReminderView:
        return ReminderView(
            enabled=row.enabled if row else False,
            browser_notifications=row.browser_notifications if row else False,
            local_time=row.local_time if row else "18:00",
            weekdays=row.weekdays if row else list(range(7)),
            version=row.version if row else 0,
            timezone=timezone,
        )

    def reminder(self, owner: UUID) -> ReminderView:
        with self.db.transaction() as session:
            account = session.get(AccountRecord, owner)
            if account is None:
                raise IdentityError(401, "authentication_required", "Please sign in")
            return self.reminder_view(
                session.get(ReminderRecord, owner), account.timezone
            )

    def update_reminder(self, owner: UUID, data: ReminderInput) -> ReminderView:
        with Practice(self.db).transaction(owner) as session:
            account = session.get(AccountRecord, owner)
            assert account is not None
            row = session.get(ReminderRecord, owner)
            values = data.model_dump(exclude={"version"})
            if row and all(getattr(row, k) == v for k, v in values.items()):
                return self.reminder_view(row, account.timezone)
            Practice.version(row.version if row else 0, data.version)
            if row is None:
                row = ReminderRecord(owner_id=owner, version=0)
                session.add(row)
            for key, value in values.items():
                setattr(row, key, value)
            row.version += 1
            session.flush()
            return self.reminder_view(row, account.timezone)

    def check_reminder(self, owner: UUID) -> ReminderDue:
        with Practice(self.db).transaction(owner) as session:
            row = session.get(ReminderRecord, owner)
            account = session.get(AccountRecord, owner)
            assert account is not None
            now = self.clock()
            day = now.astimezone(ZoneInfo(account.timezone)).date()
            delivery = session.get(ReminderDeliveryRecord, (owner, day))
            if (
                not row
                or not row.enabled
                or not reminder_due(
                    now,
                    account.timezone,
                    row.local_time,
                    row.weekdays,
                    day if delivery else None,
                )
            ):
                return ReminderDue(due=False)
            session.add(ReminderDeliveryRecord(owner_id=owner, local_day=day))
            return ReminderDue(
                due=True, browser_notifications=row.browser_notifications
            )

    def suggestion(self, owner: UUID) -> Suggestion:
        with self.db.transaction() as session:
            account = session.get(AccountRecord, owner)
            if account is None:
                raise IdentityError(401, "authentication_required", "Please sign in")
            goal = session.scalar(
                select(GoalRecord).where(
                    GoalRecord.owner_id == owner,
                    GoalRecord.period == "daily",
                    GoalRecord.effective_to.is_(None),
                    GoalRecord.paused.is_(False),
                )
            )
            minutes = min(60, goal.minutes if goal else 15)
            total = minutes * 60
            recent = session.scalar(
                select(PracticeRecord)
                .where(
                    PracticeRecord.owner_id == owner,
                    PracticeRecord.state == "saved",
                    PracticeRecord.instrument == account.instrument,
                )
                .order_by(PracticeRecord.started_at.desc())
                .limit(1)
            )
            song = (
                session.get(SongRecord, recent.song_id)
                if recent and recent.song_id
                else None
            )
            approved = detail(song) if song else None
            tempo = {"beginner": 60, "intermediate": 90, "advanced": 120}[account.skill]
            technique = (
                "Even plucking and muting"
                if account.instrument == "bass"
                else "Relaxed chord changes"
            )
            goal_label = (
                "your active daily goal (up to 60 minutes)"
                if goal
                else "an unsaved 15-minute default"
            )
            recent_label = (
                "your most recent saved song"
                if approved
                else "free practice until a saved song is available"
            )
            return Suggestion(
                name=f"{account.skill.title()} practice suggestion",
                instrument=account.instrument,
                description=(
                    "Review before saving or starting; no automatic practice credit."
                ),
                reason=(
                    f"Based on {account.instrument.replace('_', ' ')}, "
                    f"{account.skill} level; {goal_label}; {recent_label}."
                ),
                activities=[
                    ActivityInput(
                        name="Tune and settle",
                        duration_seconds=total // 5,
                        tool="tuner",
                        bpm=tempo,
                    ),
                    ActivityInput(
                        name=technique,
                        duration_seconds=total * 2 // 5,
                        tool="metronome",
                        bpm=tempo,
                    ),
                    ActivityInput(
                        name="Rhythm and rests",
                        duration_seconds=total // 5,
                        tool="metronome",
                        bpm=tempo,
                    ),
                    ActivityInput(
                        name=(approved.title if approved else "Music or free focus")[
                            :120
                        ],
                        duration_seconds=total - total // 5 * 2 - total * 2 // 5,
                        tool="song" if approved else "none",
                        song_id=recent.song_id if approved and recent else None,
                        bpm=tempo,
                    ),
                ],
            )
