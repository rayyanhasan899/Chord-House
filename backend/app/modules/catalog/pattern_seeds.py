"""Original one-bar practice exercises, not arrangements of named songs."""

from uuid import NAMESPACE_URL, uuid5

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.modules.catalog.patterns import PatternRecord, SharedPatternInput
from app.modules.content_management.seeds import GRANT

EXERCISES = [
    ("Quarter-note foundation", "4/4", 1, "DDDD", "beginner", "Foundation"),
    ("Alternating eighths", "4/4", 2, "DUDUDUDU", "beginner", "Pop"),
    ("Offbeat lift", "4/4", 2, "DRDURUDU", "intermediate", "Pop"),
    ("Muted backbeat", "4/4", 2, "DUXUDUXU", "intermediate", "Funk"),
    ("Sixteenth syncopation", "4/4", 4, "DRUUDRXUDURUDRXU", "advanced", "Funk"),
    ("Waltz foundation", "3/4", 1, "DDD", "beginner", "Waltz"),
    ("Waltz lift", "3/4", 2, "DRDUDU", "intermediate", "Waltz"),
    ("Two-beat march", "2/4", 2, "DUDU", "beginner", "March"),
    ("Six-eight pulse", "6/8", 1, "DDUDDU", "beginner", "Folk"),
    ("Six-eight space", "6/8", 1, "DRUDRU", "intermediate", "Folk"),
    ("Six-eight subdivision", "6/8", 2, "DURUDUDURUDU", "advanced", "Folk"),
    ("Two-beat sixteenths", "2/4", 4, "DXRUDUXU", "advanced", "Funk"),
]


def seed_patterns(session: Session) -> None:
    for name, meter, subdivision, strokes, difficulty, style in EXERCISES:
        data = SharedPatternInput.model_validate(
            dict(
                name=name,
                meter=meter,
                subdivision=subdivision,
                strokes=list(strokes),
                difficulty=difficulty,
                style=style,
                tempo_min=40,
                tempo_max=180,
                description=(
                    "An original one-measure exercise. Keep your hand moving "
                    "evenly through rests; start slowly and use relaxed strokes."
                ),
                status="published",
                reviewed=True,
                grant=GRANT,
                rights_statement=(
                    "Original Chord House practice exercise authored for "
                    "this project; no third-party song arrangement or text reproduced."
                ),
                attribution="Chord House original exercises",
            )
        )
        session.execute(
            insert(PatternRecord)
            .values(
                id=uuid5(NAMESPACE_URL, "chord-house:pattern:" + name),
                owner_id=None,
                **data.model_dump(mode="json"),
            )
            .on_conflict_do_nothing()
        )
