"""Original, deterministic learning guidance; completion is self-reported."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Milestone:
    code: str
    level: str
    title: str
    instruction: str
    tool: str


def curriculum(instrument: str, skill: str) -> list[Milestone]:
    family = "guitar" if instrument.endswith("guitar") else instrument
    foundations = {
        "guitar": (
            "Comfortable fretting",
            "Play an open chord with relaxed fingers; check each string separately.",
        ),
        "bass": (
            "Even plucking and muting",
            "Alternate two fingers on one string; mute unused strings and "
            "listen for even volume.",
        ),
        "ukulele": (
            "Relaxed chord shapes",
            "Play C and Am slowly; check that every intended string rings clearly.",
        ),
    }
    title, instruction = foundations[family]
    rows = [
        Milestone(
            "tuning",
            "beginner",
            "Tune and listen",
            "Tune each string, then compare its sound with its target. Recheck "
            "after playing.",
            "/tuner",
        ),
        Milestone("technique", "beginner", title, instruction, "/chords"),
        Milestone(
            "pulse",
            "beginner",
            "Keep a steady pulse",
            "Play one comfortable note or chord at 60 BPM. Stay relaxed for a "
            "minute; slow down if needed.",
            "/metronome",
        ),
        Milestone(
            "changes",
            "intermediate",
            "Connect two shapes",
            "Choose two comfortable shapes. Change on a steady pulse, keeping "
            "the sound clean before raising tempo.",
            "/chords",
        ),
        Milestone(
            "rhythm",
            "intermediate",
            "Control rhythm and rests",
            "Practice a simple rhythm with rests. Keep counting while silent; "
            "start slowly and repeat evenly.",
            "/patterns",
        ),
        Milestone(
            "song",
            "intermediate",
            "Apply a skill to music",
            "Choose an available song or original exercise. Work on one short "
            "section and note what needs attention.",
            "/songs",
        ),
        Milestone(
            "variation",
            "advanced",
            "Vary timing deliberately",
            "Use the metronome to compare subdivisions. Keep the pulse steady "
            "while changing your phrase.",
            "/metronome",
        ),
        Milestone(
            "independence",
            "advanced",
            "Build an independent routine",
            "Create a routine balancing technique, rhythm and music. Save a "
            "session and review one improvement to make next time.",
            "/practice",
        ),
    ]
    # Recommend the current level first without silently completing earlier work.
    order = {"beginner": 0, "intermediate": 1, "advanced": 2}
    current = order[skill]
    return sorted(rows, key=lambda m: (order[m.level] != current, order[m.level]))
