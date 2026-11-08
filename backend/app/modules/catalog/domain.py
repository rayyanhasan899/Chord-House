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
