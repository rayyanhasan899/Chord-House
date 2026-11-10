"""Reference definitions: MIDI equal temperament, A4 = 440 Hz; no song content."""

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.catalog.domain import Tuning
from app.modules.catalog.models import (
    InstrumentRecord,
    TuningRecord,
    TuningStringRecord,
)


def seed_reference(session: Session) -> None:
    from app.modules.catalog.pattern_seeds import seed_patterns

    seed_patterns(session)
    from app.modules.catalog.song_seeds import seed_songs

    seed_songs(session)
    for instrument, count in (
        ("acoustic_guitar", 6),
        ("electric_guitar", 6),
        ("bass", 4),
        ("ukulele", 4),
    ):
        session.execute(
            insert(InstrumentRecord)
            .values(code=instrument, string_count=count)
            .on_conflict_do_nothing()
        )
        presets: list[tuple[str, tuple[int, ...]]] = [
            ("standard", (40, 45, 50, 55, 59, 64))
        ]
        if instrument in ("acoustic_guitar", "electric_guitar"):
            presets += [
                ("drop_d", (38, 45, 50, 55, 59, 64)),
                ("dadgad", (38, 45, 50, 55, 57, 62)),
            ]
        elif instrument == "bass":
            presets = [("standard", (28, 33, 38, 43))]
        else:
            presets = [("reentrant", (67, 60, 64, 69))]
        for name, pitches in presets:
            tuning = Tuning(instrument + ":" + name, instrument, pitches)
            session.execute(
                insert(TuningRecord)
                .values(code=tuning.code, instrument_code=instrument)
                .on_conflict_do_nothing()
            )
            for position, pitch in enumerate(tuning.pitches, 1):
                session.execute(
                    insert(TuningStringRecord)
                    .values(
                        tuning_code=tuning.code, position=position, midi_pitch=pitch
                    )
                    .on_conflict_do_nothing()
                )
    from app.modules.content_management.seeds import seed_content

    seed_content(session)


def main() -> None:
    import app.core.models  # noqa: F401 -- register all referenced FK metadata
    from app.core.config import Settings
    from app.core.database import Database

    config = Settings()
    if config.database_url is None:
        raise RuntimeError("Configure CHORD_DATABASE_URL before seeding")
    db = Database(config.database_url.get_secret_value())
    try:
        with db.transaction() as session:
            seed_reference(session)
    finally:
        db.close()


if __name__ == "__main__":
    main()
