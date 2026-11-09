from collections import defaultdict
from collections.abc import Callable
from dataclasses import asdict
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import delete, select

from app.core.database import Database
from app.modules.catalog.custom_chords import CustomChordRecord
from app.modules.catalog.songs import SongRecord, detail
from app.modules.identity.domain import IdentityError
from app.modules.identity.models import AccountRecord
from app.modules.practice.domain import ActiveInterval
from app.modules.practice.models import GoalRecord, PracticeRecord
from app.modules.practice.progress_domain import daily_micros, streaks, week_start
from app.modules.practice.progress_models import MilestoneRecord, ReviewRecord
from app.modules.practice.progress_schemas import (
    CompletionInput,
    DayView,
    GoalProgress,
    MilestoneView,
    ProgressView,
    Ranking,
    ReviewInput,
    ReviewView,
    RoadmapView,
)
from app.modules.practice.roadmap import curriculum
from app.modules.practice.service import Practice, intervals


class Progress:
    def __init__(self, db: Database, clock: Callable[[], datetime] | None = None):
        self.db = db
        self.clock = clock or (lambda: datetime.now(UTC))

    def roadmap(self, owner: UUID) -> RoadmapView:

        with self.db.transaction() as session:
            account = session.get(AccountRecord, owner)

            if account is None:
                raise IdentityError(401, "authentication_required", "Please sign in")

            completed = {
                r.milestone: r.completed_at
                for r in session.scalars(
                    select(MilestoneRecord).where(
                        MilestoneRecord.owner_id == owner,
                        MilestoneRecord.instrument == account.instrument,
                    )
                )
            }

            return RoadmapView(
                instrument=account.instrument,
                skill=account.skill,
                milestones=[
                    MilestoneView(**asdict(m), completed_at=completed.get(m.code))
                    for m in curriculum(account.instrument, account.skill)
                ],
            )

    def complete(self, owner: UUID, code: str, data: CompletionInput) -> None:

        if code not in {m.code for m in curriculum(data.instrument, "beginner")}:
            raise IdentityError(404, "not_found", "Milestone not found")

        with Practice(self.db).transaction(owner) as session:
            account = session.get(AccountRecord, owner)

            if account is None or account.instrument != data.instrument:
                raise IdentityError(
                    409, "profile_changed", "Instrument changed. Refresh your roadmap."
                )

            key = (owner, data.instrument, code)

            row = session.get(MilestoneRecord, key)

            if data.completed and row is None:
                session.add(
                    MilestoneRecord(
                        owner_id=owner,
                        instrument=data.instrument,
                        milestone=code,
                        completed_at=self.clock(),
                    )
                )

            elif not data.completed:
                session.execute(
                    delete(MilestoneRecord).where(
                        MilestoneRecord.owner_id == owner,
                        MilestoneRecord.instrument == data.instrument,
                        MilestoneRecord.milestone == code,
                    )
                )

    def summary(self, owner: UUID, review_week: date | None = None) -> ProgressView:

        # Repeatable-read keeps profile, goal versions and saved sessions coherent.

        with self.db.transaction() as session:
            session.connection(execution_options={"isolation_level": "REPEATABLE READ"})

            account = session.get(AccountRecord, owner)

            if account is None:
                raise IdentityError(401, "authentication_required", "Please sign in")

            now = self.clock()

            zone = ZoneInfo(account.timezone)

            today = now.astimezone(zone).date()

            week = week_start(today)

            month = today.replace(day=1)

            selected = review_week or week - timedelta(days=7)

            self.validate_week(selected, week)

            days: dict[date, int] = defaultdict(int)

            ranks: dict[str, dict[str, int]] = {
                key: defaultdict(int) for key in ("instruments", "songs", "chords")
            }

            count = 0

            for row in session.scalars(
                select(PracticeRecord).where(
                    PracticeRecord.owner_id == owner, PracticeRecord.state == "saved"
                )
            ):
                count += 1

                periods = []

                for period in intervals(row):
                    if period.start < now:
                        periods.append(
                            ActiveInterval(period.start, min(period.end, now))
                        )

                allocated = daily_micros(periods, account.timezone)

                for day, micros in allocated.items():
                    days[day] += micros

                duration = sum(allocated.values())

                ranks["instruments"][row.instrument.replace("_", " ")] += duration

                if row.song_id:
                    song = session.get(SongRecord, row.song_id)

                    approved = detail(song) if song is not None else None
                    if approved is not None:
                        ranks["songs"][f"{approved.title} · {approved.artist}"] += (
                            duration
                        )

                chord_name = row.chord_name

                if row.chord_id:
                    chord = session.get(CustomChordRecord, row.chord_id)

                    if chord is not None and chord.owner_id == owner:
                        chord_name = chord.name

                if chord_name:
                    ranks["chords"][chord_name] += duration

            goals = list(
                session.scalars(select(GoalRecord).where(GoalRecord.owner_id == owner))
            )

            def goal_at(period: str, at: datetime) -> GoalRecord | None:

                return next(
                    (
                        g
                        for g in goals
                        if g.period == period
                        and g.effective_from <= at
                        and (g.effective_to is None or at < g.effective_to)
                    ),
                    None,
                )

            def close(day: date) -> datetime:

                return datetime.combine(
                    day + timedelta(days=1), time(), zone
                ).astimezone(UTC) - timedelta(microseconds=1)

            def day_view(day: date) -> DayView:

                goal = goal_at("daily", min(now, close(day)))

                active = goal is not None and not goal.paused

                seconds = days.get(day, 0) / 1000000

                return DayView(
                    day=day.isoformat(),
                    seconds=seconds,
                    goal_minutes=goal.minutes if active and goal else None,
                    goal_met=seconds >= goal.minutes * 60 if active and goal else None,
                )

            def between(start: date, end: date) -> float:

                return sum(v for d, v in days.items() if start <= d < end) / 1000000

            current, best = streaks({d for d, v in days.items() if v > 0}, today)

            targets = []

            for goal_period in ("daily", "weekly"):
                goal = goal_at(goal_period, now)

                if goal:
                    seconds = between(
                        today if goal_period == "daily" else week,
                        today + timedelta(days=1),
                    )

                    targets.append(
                        GoalProgress(
                            period=goal_period,
                            minutes=goal.minutes,
                            paused=goal.paused,
                            seconds=seconds,
                            percent=min(100, seconds / (goal.minutes * 60) * 100),
                        )
                    )

            review_days = [day_view(selected + timedelta(days=i)) for i in range(7)]

            end = selected + timedelta(days=7)

            weekly = goal_at("weekly", min(now, close(end - timedelta(days=1))))

            review_seconds = between(selected, end)

            note = session.get(ReviewRecord, (owner, selected.isoformat()))

            review = ReviewView(
                week=selected.isoformat(),
                end=end.isoformat(),
                seconds=review_seconds,
                practice_days=sum(d.seconds > 0 for d in review_days),
                achieved_daily_goals=sum(d.goal_met is True for d in review_days),
                evaluated_daily_goals=sum(d.goal_met is not None for d in review_days),
                weekly_goal_met=review_seconds >= weekly.minutes * 60
                if weekly and not weekly.paused
                else None,
                improvement=note.improvement if note else "",
                version=note.version if note else 0,
            )

            def ranking(key: str) -> list[Ranking]:

                return [
                    Ranking(label=k, seconds=v / 1000000)
                    for k, v in sorted(
                        ranks[key].items(), key=lambda item: (-item[1], item[0])
                    )[:10]
                    if v > 0
                ]

            return ProgressView(
                timezone=account.timezone,
                as_of=now,
                today=today.isoformat(),
                week=week.isoformat(),
                month=month.isoformat(),
                total_seconds=sum(days.values()) / 1000000,
                today_seconds=between(today, today + timedelta(days=1)),
                week_seconds=between(week, today + timedelta(days=1)),
                month_seconds=between(month, today + timedelta(days=1)),
                saved_sessions=count,
                current_streak=current,
                longest_streak=best,
                days=[day_view(today - timedelta(days=i)) for i in reversed(range(28))],
                goals=targets,
                instruments=ranking("instruments"),
                songs=ranking("songs"),
                chords=ranking("chords"),
                review=review,
            )

    @staticmethod
    def validate_week(selected: date, current: date) -> None:

        if selected.weekday() != 0 or selected >= current or selected.year < 1900:
            raise IdentityError(
                422,
                "invalid_week",
                "Choose a Monday in a completed week (1900 or later)",
            )

    def review(self, owner: UUID, week: date, data: ReviewInput) -> None:

        with Practice(self.db).transaction(owner) as session:
            account = session.get(AccountRecord, owner)

            assert account is not None

            current = week_start(
                self.clock().astimezone(ZoneInfo(account.timezone)).date()
            )

            self.validate_week(week, current)

            row = session.get(ReviewRecord, (owner, week.isoformat()))

            if row and row.improvement == data.improvement:
                return

            Practice.version(row.version if row else 0, data.version)

            if not data.improvement:
                if row:
                    session.delete(row)

                return

            if row is None:
                row = ReviewRecord(owner_id=owner, week=week.isoformat(), version=0)

                session.add(row)

            row.improvement = data.improvement

            row.version += 1
