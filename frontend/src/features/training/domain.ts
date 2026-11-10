export type Level = "beginner" | "intermediate" | "advanced";
export type EarMode = "note" | "interval" | "quality";
export const noteNames = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];
const intervals = [
  "Unison",
  "Minor second",
  "Major second",
  "Minor third",
  "Major third",
  "Perfect fourth",
  "Tritone",
  "Perfect fifth",
  "Minor sixth",
  "Major sixth",
  "Minor seventh",
  "Major seventh",
  "Octave",
];
const qualities = {
  Major: [0, 4, 7],
  Minor: [0, 3, 7],
  Diminished: [0, 3, 6],
  Augmented: [0, 4, 8],
  "Suspended 2": [0, 2, 7],
  "Suspended 4": [0, 5, 7],
  "Dominant 7": [0, 4, 7, 10],
  "Major 7": [0, 4, 7, 11],
  "Minor 7": [0, 3, 7, 10],
};
export type Question = {
  notes: number[];
  answer: string;
  options: string[];
  explanation: string;
  sequential: boolean;
};
function pick<T>(items: readonly T[], random: () => number): T {
  const n = random();
  if (!Number.isFinite(n) || n < 0 || n >= 1)
    throw new Error("Random source must be in [0,1)");
  return items[Math.floor(n * items.length)];
}
export function question(
  mode: EarMode,
  level: Level,
  random = Math.random,
): Question {
  const root =
    level === "beginner"
      ? 60
      : pick([48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67], random);
  if (mode === "note") {
    const choices =
      level === "beginner"
        ? [0, 2, 4, 7, 9]
        : Array.from({ length: 12 }, (_, i) => i);
    const offset = pick(choices, random),
      octave = level === "advanced" ? pick([48, 60, 72], random) : 60;
    const midi = octave + offset;
    return {
      notes: [midi],
      answer: noteNames[offset],
      options: choices.map((i) => noteNames[i]),
      explanation: `The pitch is ${noteNames[offset]}${Math.floor(midi / 12) - 1}. Compare it with the C4 reference; sharps/flats are equivalent names for the same pitch.`,
      sequential: false,
    };
  }
  if (mode === "interval") {
    const choices =
      level === "beginner"
        ? [0, 2, 4, 7, 12]
        : Array.from({ length: 13 }, (_, i) => i);
    const distance = pick(choices, random);
    return {
      notes: [root, root + distance],
      answer: intervals[distance],
      options: choices.map((i) => intervals[i]),
      explanation: `${intervals[distance]} spans ${distance} semitones from the first tone. A semitone is one fret.`,
      sequential: true,
    };
  }
  const keys = (
    level === "beginner"
      ? ["Major", "Minor"]
      : level === "intermediate"
        ? [
            "Major",
            "Minor",
            "Diminished",
            "Augmented",
            "Suspended 2",
            "Suspended 4",
          ]
        : Object.keys(qualities)
  ) as (keyof typeof qualities)[];
  const quality = pick(keys, random);
  return {
    notes: qualities[quality].map((n) => root + n),
    answer: quality,
    options: keys,
    explanation: `${quality} uses semitone offsets ${qualities[quality].join(", ")} above its root. Listen to the spacing rather than volume.`,
    sequential: false,
  };
}
export function sequencePosition(
  elapsed: number,
  interval: number,
  count: number,
) {
  if (
    !Number.isFinite(elapsed) ||
    elapsed < 0 ||
    !Number.isFinite(interval) ||
    interval <= 0 ||
    !Number.isInteger(count) ||
    count < 1
  )
    throw new Error("Invalid sequence timing");
  const step = Math.floor(elapsed / interval);
  return { current: step % count, next: (step + 1) % count, step };
}
export function randomized<T>(
  items: readonly T[],
  count: number,
  random = Math.random,
): T[] {
  if (items.length < 2 || !Number.isInteger(count) || count < 2 || count > 8)
    throw new Error("Choose at least two chords");
  const result: T[] = [];
  for (let i = 0; i < count; i++)
    result.push(
      pick(
        items.filter((item) => item !== result[i - 1]),
        random,
      ),
    );
  return result;
}
export function fretNote(open: number, fret: number) {
  if (
    !Number.isInteger(open) ||
    open < 0 ||
    open > 127 ||
    !Number.isInteger(fret) ||
    fret < 0 ||
    fret > 24
  )
    throw new Error("Choose fret 0–24");
  const midi = open + fret;
  if (midi > 127) throw new Error("Note exceeds MIDI range");
  return {
    midi,
    name: noteNames[midi % 12] + (Math.floor(midi / 12) - 1),
    hz: 440 * 2 ** ((midi - 69) / 12),
  };
}
