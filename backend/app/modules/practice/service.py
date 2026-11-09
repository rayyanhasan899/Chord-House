import hashlib
import json
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import Database
from app.modules.catalog.custom_chords import CustomChordRecord
from app.modules.catalog.patterns import PatternRecord
from app.modules.catalog.songs import SongRecord, detail
from app.modules.identity.domain import IdentityError
from app.modules.identity.models import AccountRecord
from app.modules.practice.domain import (
    LONG_SECONDS,
    ActiveInterval,
    aware,
    elapsed_micros,
    overlaps,
    total_micros,
    validate_saved,
)
from app.modules.practice.models import (
    ActivityRecord,
    GoalRecord,
    PracticeRecord,
    PracticeStartRecord,
    RoutineRecord,
)
from app.modules.practice.schemas import (
    ActivityInput,
    Command,
    GoalInput,
    GoalView,
    RoutineCreate,
    RoutineInput,
    RoutineUpdate,
    RoutineView,
    SessionDetails,
    SessionStart,
    SessionUpdate,
    SessionView,
)


def utcnow() -> datetime:
    return datetime.now(UTC)


def fingerprint(data: object) -> str:
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()


def intervals(row: PracticeRecord) -> list[ActiveInterval]:
    return [
        ActiveInterval(
            datetime.fromisoformat(i["start"]), datetime.fromisoformat(i["end"])
        )
        for i in row.intervals
    ]


def instrument_kind(value: str) -> str:
    return "guitar" if value.endswith("guitar") else value


class Practice:
    def __init__(self, db: Database, clock: Callable[[], datetime] | None = None):
        self.db, self.clock = db, clock or utcnow

    @contextmanager
    def transaction(self, owner: UUID) -> Iterator[Session]:
        try:
            with self.db.transaction() as session:
                if (
                    session.scalar(
                        select(AccountRecord.id)
                        .where(AccountRecord.id == owner)
                        .with_for_update()
                    )
                    is None
                ):
                    raise IdentityError(
                        401, "authentication_required", "Please sign in"
                    )
                yield session
        except ValueError as error:
            raise IdentityError(422, "invalid_practice", str(error)) from None
        except IntegrityError:
            raise IdentityError(
                409,
                "practice_conflict",
                "Practice changed concurrently. Refresh and retry.",
            ) from None

    def links(
        self,
        session: Session,
        owner: UUID,
        instrument: str,
        data: SessionDetails | ActivityInput,
        previous: SessionDetails | None = None,
    ) -> None:
        if data.song_id and (previous is None or data.song_id != previous.song_id):
            song = session.get(SongRecord, data.song_id)
            if song is None or detail(song) is None:
                raise ValueError("Choose an available catalog song")
        if data.chord_id:
            chord = session.scalar(
                select(CustomChordRecord).where(
                    CustomChordRecord.id == data.chord_id,
                    CustomChordRecord.owner_id == owner,
                )
            )
            if chord is None or chord.instrument != instrument_kind(instrument):
                raise ValueError("Choose your own compatible custom chord")
        if isinstance(data, ActivityInput) and data.pattern_id:
            pattern = session.get(PatternRecord, data.pattern_id)
            if pattern is None or not (
                pattern.status == "published" or pattern.owner_id == owner
            ):
                raise ValueError(
                    "Choose an available pattern or your own private pattern"
                )

    @staticmethod
    def version(current: int, supplied: int) -> None:
        if current != supplied:
            raise IdentityError(
                409, "stale_practice", "This record changed. Refresh before editing."
            )

    @staticmethod
    def session_row(session: Session, owner: UUID, identifier: UUID) -> PracticeRecord:
        row = session.scalar(
            select(PracticeRecord).where(
                PracticeRecord.id == identifier, PracticeRecord.owner_id == owner
            )
        )
        if row is None:
            raise IdentityError(404, "not_found", "Practice session not found")
        return row

    def materialize(self, row: PracticeRecord, now: datetime) -> None:
        if (
            row.state != "active"
            or row.running_since is None
            or row.target_seconds is None
        ):
            return
        remaining = row.target_seconds * 1000000 - total_micros(intervals(row))
        deadline = row.running_since + timedelta(microseconds=max(0, remaining))
        if now >= deadline:
            self.close_interval(row, deadline)
            row.state, row.ended_at = "ended", deadline
            row.version += 1

    @staticmethod
    def close_interval(row: PracticeRecord, at: datetime) -> None:
        if row.running_since is not None:
            interval = ActiveInterval(row.running_since, at)
            if interval.micros:
                row.intervals = [
                    *row.intervals,
                    {
                        "start": interval.start.isoformat(),
                        "end": interval.end.isoformat(),
                    },
                ]
        row.running_since = None
        row.duration_seconds = total_micros(intervals(row)) // 1000000

    @staticmethod
    def view(row: PracticeRecord, now: datetime) -> SessionView:
        values = {
            key: getattr(row, key)
            for key in SessionView.model_fields
            if key not in ("as_of", "duration_seconds")
        }
        return SessionView.model_validate(
            values
            | {
                "duration_seconds": elapsed_micros(
                    intervals(row), row.running_since, now
                )
                // 1000000,
                "as_of": now,
            }
        )

    def current(self, owner: UUID) -> SessionView | None:
        with self.transaction(owner) as session:
            row = session.scalar(
                select(PracticeRecord).where(
                    PracticeRecord.owner_id == owner, PracticeRecord.state != "saved"
                )
            )
            if row is None:
                return None
            now = self.clock()
            self.materialize(row, now)
            return self.view(row, now)

    def start(self, owner: UUID, data: SessionStart) -> SessionView:
        with self.transaction(owner) as session:
            key = session.get(PracticeStartRecord, (owner, data.client_key))
            digest = fingerprint(data.model_dump(mode="json", exclude={"client_key"}))
            if key:
                if key.creation_hash != digest:
                    raise IdentityError(
                        409, "key_reused", "Use a new key for different session details"
                    )
                if key.session_id is None:
                    raise IdentityError(
                        410,
                        "session_deleted",
                        "This session was deleted. Start a new one.",
                    )
                row = self.session_row(session, owner, key.session_id)
                now = self.clock()
                self.materialize(row, now)
                return self.view(row, now)
            if session.scalar(
                select(PracticeRecord.id).where(
                    PracticeRecord.owner_id == owner, PracticeRecord.state != "saved"
                )
            ):
                raise IdentityError(
                    409,
                    "open_session",
                    "Finish, save or discard your existing session first",
                )
            self.links(session, owner, data.instrument, data)
            account = session.get(AccountRecord, owner)
            assert account is not None
            snapshot = None
            target = data.target_seconds
            if data.routine_id:
                routine = self.routine_row(session, owner, data.routine_id)
                view = self.routine_view(session, routine)
                if view.warnings:
                    raise ValueError("Repair missing routine targets before starting")
                if routine.instrument != data.instrument:
                    raise ValueError("Session instrument must match the routine")
                for activity in view.activities:
                    self.links(session, owner, data.instrument, activity)
                snapshot = view.model_dump(mode="json")
                target = sum(a.duration_seconds for a in view.activities)
            now = self.clock()
            row = PracticeRecord(
                id=uuid4(),
                owner_id=owner,
                **data.model_dump(exclude={"client_key", "target_seconds"}),
                state="active",
                routine_snapshot=snapshot,
                timezone=account.timezone,
                started_at=now,
                running_since=now,
                ended_at=None,
                intervals=[],
                duration_seconds=0,
                target_seconds=target,
                version=1,
            )
            session.add(row)
            session.flush()
            session.add(
                PracticeStartRecord(
                    owner_id=owner,
                    client_key=data.client_key,
                    session_id=row.id,
                    creation_hash=digest,
                )
            )
            return self.view(row, now)

    def command(
        self, owner: UUID, identifier: UUID, action: str, data: Command
    ) -> SessionView:
        with self.transaction(owner) as session:
            row = self.session_row(session, owner, identifier)
            now = self.clock()
            self.materialize(row, now)
            desired = {
                "pause": "paused",
                "resume": "active",
                "end": "ended",
                "save": "saved",
            }[action]
            if (
                row.state == desired
                or row.state == "saved"
                and action in ("save", "end")
            ):
                return self.view(row, now)
            self.version(row.version, data.version)
            if action == "pause" and row.state == "active":
                self.close_interval(row, now)
                row.state = "paused"
            elif action == "resume" and row.state == "paused":
                row.state, row.running_since = "active", now
            elif action == "end" and row.state in ("active", "paused"):
                self.close_interval(row, now)
                row.state, row.ended_at = "ended", now
            elif action == "save" and row.state == "ended":
                row.duration_seconds = validate_saved(intervals(row), now)
                if row.duration_seconds > LONG_SECONDS and not data.confirm_long:
                    raise ValueError(
                        "Over four hours: review and confirm the duration before saving"
                    )
                self.no_overlap(session, owner, row.id, intervals(row))
                row.state = "saved"
            else:
                raise IdentityError(
                    409,
                    "invalid_transition",
                    "This action is unavailable for the current session state",
                )
            row.version += 1
            session.flush()
            return self.view(row, now)

    @staticmethod
    def no_overlap(
        session: Session, owner: UUID, identifier: UUID, periods: list[ActiveInterval]
    ) -> None:
        if not periods:
            return
        for other in session.scalars(
            select(PracticeRecord).where(
                PracticeRecord.owner_id == owner,
                PracticeRecord.id != identifier,
                PracticeRecord.state == "saved",
                PracticeRecord.started_at < periods[-1].end,
                PracticeRecord.ended_at > periods[0].start,
            )
        ):
            if overlaps(periods, intervals(other)):
                raise ValueError(
                    "Active time overlaps a saved session. Correct the times first."
                )

    def history(self, owner: UUID, offset: int, limit: int) -> list[SessionView]:
        with self.db.transaction() as session:
            now = self.clock()
            return [
                self.view(row, now)
                for row in session.scalars(
                    select(PracticeRecord)
                    .where(
                        PracticeRecord.owner_id == owner,
                        PracticeRecord.state == "saved",
                    )
                    .order_by(PracticeRecord.started_at.desc(), PracticeRecord.id)
                    .offset(offset)
                    .limit(limit)
                )
            ]

    def get_session(self, owner: UUID, identifier: UUID) -> SessionView:
        with self.transaction(owner) as session:
            row = self.session_row(session, owner, identifier)
            now = self.clock()
            self.materialize(row, now)
            return self.view(row, now)

    def update_session(
        self, owner: UUID, identifier: UUID, data: SessionUpdate
    ) -> SessionView:
        with self.transaction(owner) as session:
            row = self.session_row(session, owner, identifier)
            self.version(row.version, data.version)
            if row.state not in ("ended", "saved"):
                raise IdentityError(
                    409, "session_running", "End the session before editing it"
                )
            previous = SessionDetails.model_validate(
                {k: getattr(row, k) for k in SessionDetails.model_fields}
            )
            self.links(session, owner, data.instrument, data, previous)
            now = self.clock()
            if data.corrected_start is not None and data.corrected_seconds is not None:
                start = aware(data.corrected_start)
                periods = [
                    ActiveInterval(
                        start, start + timedelta(seconds=data.corrected_seconds)
                    )
                ]
                row.duration_seconds = validate_saved(periods, now)
                if row.duration_seconds > LONG_SECONDS and not data.confirm_long:
                    raise ValueError("Review and confirm corrections over four hours")
                if row.state == "saved":
                    self.no_overlap(session, owner, row.id, periods)
                row.started_at, row.ended_at = periods[0].start, periods[0].end
                row.intervals = [
                    {
                        "start": periods[0].start.isoformat(),
                        "end": periods[0].end.isoformat(),
                    }
                ]
                row.target_seconds = None
            for key, value in data.model_dump(
                exclude={
                    "version",
                    "confirm_long",
                    "corrected_start",
                    "corrected_seconds",
                }
            ).items():
                setattr(row, key, value)
            row.version += 1
            session.flush()
            return self.view(row, now)

    def delete_session(self, owner: UUID, identifier: UUID, version: int) -> None:
        with self.transaction(owner) as session:
            row = self.session_row(session, owner, identifier)
            self.version(row.version, version)
            session.delete(row)

    @staticmethod
    def routine_row(session: Session, owner: UUID, identifier: UUID) -> RoutineRecord:
        row = session.scalar(
            select(RoutineRecord).where(
                RoutineRecord.id == identifier, RoutineRecord.owner_id == owner
            )
        )
        if row is None:
            raise IdentityError(404, "not_found", "Routine not found")
        return row

    @staticmethod
    def routine_view(session: Session, row: RoutineRecord) -> RoutineView:
        activities = []
        warnings = []
        for activity in session.scalars(
            select(ActivityRecord)
            .where(ActivityRecord.routine_id == row.id)
            .order_by(ActivityRecord.position)
        ):
            values = {k: getattr(activity, k) for k in ActivityInput.model_fields}
            if (
                (activity.tool == "song" and activity.song_id is None)
                or (activity.tool == "pattern" and activity.pattern_id is None)
                or (activity.requires_chord and activity.chord_id is None)
            ):
                values["tool"] = "none"
                warnings.append(
                    f"{activity.name}: linked target was deleted; choose a replacement."
                )
            activities.append(ActivityInput.model_validate(values))
        return RoutineView.model_validate(
            dict(
                id=row.id,
                name=row.name,
                description=row.description,
                instrument=row.instrument,
                activities=activities,
                version=row.version,
                warnings=warnings,
            )
        )

    def get_routine(self, owner: UUID, identifier: UUID) -> RoutineView:
        with self.db.transaction() as session:
            return self.routine_view(
                session, self.routine_row(session, owner, identifier)
            )

    def list_routines(self, owner: UUID, offset: int, limit: int) -> list[RoutineView]:
        with self.db.transaction() as session:
            return [
                self.routine_view(session, row)
                for row in session.scalars(
                    select(RoutineRecord)
                    .where(RoutineRecord.owner_id == owner)
                    .order_by(RoutineRecord.created_at, RoutineRecord.id)
                    .offset(offset)
                    .limit(limit)
                )
            ]

    def write_routine(
        self, session: Session, owner: UUID, row: RoutineRecord, data: RoutineInput
    ) -> RoutineView:
        for activity in data.activities:
            self.links(session, owner, data.instrument, activity)
        row.name, row.description, row.instrument = (
            data.name,
            data.description,
            data.instrument,
        )
        session.add(row)
        session.flush()
        session.execute(
            delete(ActivityRecord).where(ActivityRecord.routine_id == row.id)
        )
        for position, activity in enumerate(data.activities):
            session.add(
                ActivityRecord(
                    id=uuid4(),
                    routine_id=row.id,
                    position=position,
                    requires_chord=activity.chord_id is not None,
                    **activity.model_dump(),
                )
            )
        session.flush()
        return self.routine_view(session, row)

    def create_routine(self, owner: UUID, data: RoutineCreate) -> RoutineView:
        with self.transaction(owner) as session:
            digest = fingerprint(data.model_dump(mode="json", exclude={"client_key"}))
            existing = session.scalar(
                select(RoutineRecord).where(
                    RoutineRecord.owner_id == owner,
                    RoutineRecord.client_key == data.client_key,
                )
            )
            if existing:
                if existing.creation_hash != digest:
                    raise IdentityError(
                        409, "key_reused", "Use a new key for different routine content"
                    )
                return self.routine_view(session, existing)
            row = RoutineRecord(
                id=uuid4(),
                owner_id=owner,
                client_key=data.client_key,
                creation_hash=digest,
                version=1,
            )
            return self.write_routine(session, owner, row, data)

    def update_routine(
        self, owner: UUID, identifier: UUID, data: RoutineUpdate
    ) -> RoutineView:
        with self.transaction(owner) as session:
            row = self.routine_row(session, owner, identifier)
            self.version(row.version, data.version)
            row.version += 1
            return self.write_routine(session, owner, row, data)

    def duplicate_routine(
        self, owner: UUID, identifier: UUID, key: UUID
    ) -> RoutineView:
        with self.transaction(owner) as session:
            digest = fingerprint({"duplicate": str(identifier)})
            existing = session.scalar(
                select(RoutineRecord).where(
                    RoutineRecord.owner_id == owner, RoutineRecord.client_key == key
                )
            )
            if existing:
                if existing.creation_hash != digest:
                    raise IdentityError(409, "key_reused", "Use a new duplication key")
                return self.routine_view(session, existing)
            source = self.routine_row(session, owner, identifier)
            view = self.routine_view(session, source)
            if view.warnings:
                raise ValueError("Repair missing routine targets before duplicating")
            data = RoutineInput.model_validate(
                view.model_dump(include=set(RoutineInput.model_fields))
            )
            data.name = data.name[:113] + " (copy)"
            row = RoutineRecord(
                id=uuid4(),
                owner_id=owner,
                client_key=key,
                creation_hash=digest,
                version=1,
            )
            return self.write_routine(session, owner, row, data)

    def delete_routine(self, owner: UUID, identifier: UUID, version: int) -> None:
        with self.transaction(owner) as session:
            row = self.routine_row(session, owner, identifier)
            self.version(row.version, version)
            session.delete(row)

    def goals(self, owner: UUID) -> list[GoalView]:
        with self.db.transaction() as session:
            return [
                GoalView.model_validate(row)
                for row in session.scalars(
                    select(GoalRecord)
                    .where(
                        GoalRecord.owner_id == owner, GoalRecord.effective_to.is_(None)
                    )
                    .order_by(GoalRecord.period)
                )
            ]

    def goal(self, owner: UUID, period: str, data: GoalInput) -> GoalView:
        with self.transaction(owner) as session:
            if period == "daily" and data.minutes > 1440:
                raise ValueError("Daily goal cannot exceed 1440 minutes")
            current = session.scalar(
                select(GoalRecord).where(
                    GoalRecord.owner_id == owner,
                    GoalRecord.period == period,
                    GoalRecord.effective_to.is_(None),
                )
            )
            if current and (current.minutes, current.paused) == (
                data.minutes,
                data.paused,
            ):
                return GoalView.model_validate(current)
            self.version(current.version if current else 0, data.version)
            now = self.clock()
            if current:
                current.effective_to = now
                session.flush()
            row = GoalRecord(
                id=uuid4(),
                owner_id=owner,
                period=period,
                minutes=data.minutes,
                paused=data.paused,
                version=(current.version + 1 if current else 1),
                effective_from=now,
                effective_to=None,
            )
            session.add(row)
            session.flush()
            return GoalView.model_validate(row)
