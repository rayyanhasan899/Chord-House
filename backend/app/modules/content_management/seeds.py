"""Non-overwriting migration of original offline reference definitions."""

import json
from importlib.resources import files

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.catalog.models import (
    InstrumentRecord,
    TuningRecord,
    TuningStringRecord,
)
from app.modules.content_management.models import ReferenceContent

GRANT = dict(
    origin="application",
    license="Project original reference definitions",
    source_url="https://github.com/rayyanhasan899/Chord-House",
    attribution="Chord House original reference exercises",
    evidence=(
        "Original mathematical definitions and structured shapes from "
        "Phases 04/09; no third-party song material."
    ),
    terms_version="original-v1",
    reviewer="Chord House reference seed",
    reviewed=True,
    display=True,
    cache=True,
    transpose=True,
    territories=["*"],
    expires_at=None,
)


def seed_content(session: Session) -> None:
    def add(
        kind: str, key: str, document: dict[str, object], status: str = "published"
    ) -> None:
        session.execute(
            insert(ReferenceContent)
            .values(
                kind=kind,
                key=key,
                document=document | {"grant": GRANT},
                status=status,
                revision=1,
            )
            .on_conflict_do_nothing()
        )

    labels = {
        "acoustic_guitar": "Acoustic guitar",
        "electric_guitar": "Electric guitar",
        "bass": "Bass guitar",
        "ukulele": "Ukulele",
    }
    for instrument in session.scalars(select(InstrumentRecord)):
        add(
            "instrument",
            instrument.code,
            dict(
                name=labels.get(instrument.code, instrument.code),
                string_count=instrument.string_count,
            ),
        )
    for tuning in session.scalars(select(TuningRecord)):
        pitches = list(
            session.scalars(
                select(TuningStringRecord.midi_pitch)
                .where(TuningStringRecord.tuning_code == tuning.code)
                .order_by(TuningStringRecord.position)
            )
        )
        suffix = tuning.code.split(":")[-1]
        name = {
            "standard": "standard",
            "drop_d": "Drop D",
            "dadgad": "DADGAD",
            "reentrant": "re-entrant",
        }.get(suffix, suffix)
        prefix = (
            "Guitar"
            if "guitar" in tuning.instrument_code
            else "Bass"
            if tuning.instrument_code == "bass"
            else "Ukulele"
        )
        add(
            "tuning",
            tuning.code,
            dict(
                name=prefix + " " + name,
                instrument=tuning.instrument_code,
                pitches=pitches,
            ),
            "archived" if tuning.archived else "published",
        )
    entries = json.loads(
        files("app.modules.catalog")
        .joinpath("data", "reference-chords.json")
        .read_text(encoding="utf-8")
    )
    for index, entry in enumerate(entries):
        entry.pop("source", None)
        add("chord", f"original-{index:03}", entry)
