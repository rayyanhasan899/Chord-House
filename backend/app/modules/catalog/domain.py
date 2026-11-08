from dataclasses import dataclass
from math import isfinite
from typing import Protocol


@dataclass(frozen=True)
class Tuning:
    code: str
    instrument: str
    pitches: tuple[int, ...]

    def __post_init__(self) -> None:
        counts = {"acoustic_guitar": 6, "electric_guitar": 6, "bass": 4, "ukulele": 4}
        if not self.code or self.instrument not in counts:
            raise ValueError("Unknown instrument or empty tuning code")
        if len(self.pitches) != counts[self.instrument]:
            raise ValueError("String count does not match instrument")
        if any(
            type(pitch) is not int or not 0 <= pitch <= 127 for pitch in self.pitches
        ):
            raise ValueError("MIDI pitches must be integers from 0 to 127")

    def frequencies(self, reference: float = 440.0) -> tuple[float, ...]:
        if not isfinite(reference) or reference <= 0:
            raise ValueError("Reference frequency must be finite and positive")
        return tuple(reference * 2 ** ((pitch - 69) / 12) for pitch in self.pitches)


class TuningRepository(Protocol):
    def get(self, code: str) -> Tuning | None: ...


def validate_chord(
    name: str, instrument: str, frets: list[int], fingers: list[int]
) -> None:
    if instrument not in ("guitar", "bass", "ukulele"):
        raise ValueError("Unsupported instrument")
    count = 6 if instrument == "guitar" else 4
    if not name.strip() or len(frets) != count or len(fingers) != count:
        raise ValueError("Name and instrument string count must be valid")
    if all(fret == -1 for fret in frets):
        raise ValueError("At least one string must sound")
    for fret, finger in zip(frets, fingers, strict=True):
        if (
            not -1 <= fret <= 24
            or not 0 <= finger <= 4
            or (fret <= 0 and finger != 0)
            or (fret > 0 and finger == 0)
        ):
            raise ValueError("Use mute -1/open 0, frets 1-24 and fingers 1-4")
    positive = [fret for fret in frets if fret > 0]
    if positive and max(positive) - min(positive) > 4:
        raise ValueError("Fretted span exceeds four frets")
    for finger in range(1, 5):
        indices = [i for i, value in enumerate(fingers) if value == finger]
        if indices:
            fret = frets[indices[0]]
            if any(frets[i] != fret for i in indices) or any(
                0 <= frets[i] < fret for i in range(min(indices), max(indices) + 1)
            ):
                raise ValueError("Inconsistent finger or obstructed barre")
