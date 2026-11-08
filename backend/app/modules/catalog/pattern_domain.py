"""Framework-independent rhythm and publication rules."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Rhythm:
    meter: str
    subdivision: int
    strokes: tuple[str, ...]
    tempo_min: int
    tempo_max: int

    def __post_init__(self) -> None:
        if self.meter not in ("2/4", "3/4", "4/4", "6/8"):
            raise ValueError("Unsupported meter")
        if self.subdivision not in (1, 2, 4):
            raise ValueError("Use one, two or four steps per beat")
        if len(self.strokes) != int(self.meter[0]) * self.subdivision:
            raise ValueError("Steps must fill exactly one measure")
        if any(s not in ("D", "U", "R", "X") for s in self.strokes):
            raise ValueError("Use D down, U up, R rest or X muted stroke")
        if all(s == "R" for s in self.strokes):
            raise ValueError("At least one stroke must sound")
        if not 30 <= self.tempo_min <= self.tempo_max <= 300:
            raise ValueError("Tempo range must be ordered within 30-300")


def publication_allowed(reviewed: bool, rights: str, attribution: str) -> None:
    if not reviewed or len(rights.strip()) < 12 or not attribution.strip():
        raise ValueError(
            "Publication requires review, rights statement and attribution"
        )
