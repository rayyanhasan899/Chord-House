export type Instrument = "guitar" | "bass" | "ukulele";
export const tuning: Record<Instrument, number[]> = {
  guitar: [40, 45, 50, 55, 59, 64],
  bass: [28, 33, 38, 43],
  ukulele: [67, 60, 64, 69],
};
export const names = [
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
export const qualities: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};
export const noteName = (midi: number) =>
  names[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
export type Voicing = {
  name: string;
  instrument: Instrument;
  quality: string;
  frets: number[];
  fingers: number[];
  difficulty: string;
  guidance: string;
  source: string;
};
export function fingering(frets: number[]): number[] {
  const fingers = frets.map(() => 0);
  let finger = 1;
  for (const fret of [...new Set(frets.filter((f) => f > 0))].sort(
    (a, b) => a - b,
  )) {
    const indices = frets.flatMap((f, i) => (f === fret ? [i] : []));
    let previous = -1;
    for (const index of indices) {
      if (
        previous >= 0 &&
        frets.slice(previous, index + 1).every((f) => f < 0 || f >= fret)
      )
        fingers[index] = fingers[previous];
      else fingers[index] = finger++;
      previous = index;
    }
  }
  return fingers;
}
export function validate(
  instrument: Instrument,
  frets: number[],
  fingers: number[],
): string | null {
  if (
    frets.length !== tuning[instrument].length ||
    fingers.length !== frets.length
  )
    return "String count does not match instrument.";
  if (frets.every((f) => f === -1)) return "At least one string must sound.";
  if (
    frets.some(
      (f, i) =>
        !Number.isInteger(f) ||
        f < -1 ||
        f > 24 ||
        !Number.isInteger(fingers[i]) ||
        fingers[i] < 0 ||
        fingers[i] > 4 ||
        (f <= 0 ? fingers[i] !== 0 : fingers[i] === 0),
    )
  )
    return "Use frets -1 (mute), 0 (open), 1-24 and fingers 1-4.";
  const positive = frets.filter((f) => f > 0);
  if (positive.length && Math.max(...positive) - Math.min(...positive) > 4)
    return "Fretted span exceeds four frets.";
  for (let finger = 1; finger <= 4; finger++) {
    const indices = fingers.flatMap((f, i) => (f === finger ? [i] : []));
    if (indices.length) {
      const fret = frets[indices[0]];
      if (
        indices.some((i) => frets[i] !== fret) ||
        frets
          .slice(indices[0], indices.at(-1)! + 1)
          .some((f) => f >= 0 && f < fret)
      )
        return "A finger cannot occupy different frets or obstruct an open/lower string.";
    }
  }
  return null;
}
export function pitches(instrument: Instrument, frets: number[]): number[] {
  return frets.flatMap((f, i) => (f < 0 ? [] : [tuning[instrument][i] + f]));
}
const shapes: Record<Instrument, Record<string, number[]>> = {
  guitar: {
    major: [0, 2, 2, 1, 0, 0],
    minor: [0, 2, 2, 0, 0, 0],
    "7": [0, 2, 0, 1, 0, 0],
    maj7: [0, 2, 1, 1, 0, 0],
    m7: [0, 2, 0, 0, 0, 0],
    sus2: [0, 2, 4, 4, 0, 0],
    sus4: [0, 2, 2, 2, 0, 0],
  },
  bass: { major: [0, 2, 2, 1], minor: [0, 2, 2, 0] },
  ukulele: {
    major: [0, 0, 0, 3],
    minor: [0, 3, 3, 3],
    "7": [0, 0, 0, 1],
    maj7: [0, 0, 0, 2],
    m7: [3, 3, 3, 3],
    sus2: [0, 2, 3, 3],
    sus4: [0, 0, 1, 3],
  },
};
function make(
  name: string,
  instrument: Instrument,
  quality: string,
  frets: number[],
): Voicing {
  return {
    name,
    instrument,
    quality,
    frets,
    fingers: fingering(frets),
    difficulty:
      Math.min(...frets.filter((f) => f > 0)) > 3 ||
      frets.filter((f) => f > 0).length > 3
        ? "intermediate"
        : "beginner",
    guidance:
      "Read strings in displayed instrument order. X is muted; O is open. Repeated finger numbers indicate a barre. Keep fingertips close to the fret wire; stop if a stretch hurts.",
    source:
      "Original structured voicings, transposed mathematically and checked for complete chord-tone sets; not expert-reviewed performance advice.",
  };
}
export const library: Voicing[] = [];
for (const instrument of Object.keys(tuning) as Instrument[])
  for (let root = 0; root < 12; root++)
    for (const [quality, shape] of Object.entries(shapes[instrument])) {
      const offset = (root - (instrument === "ukulele" ? 0 : 4) + 12) % 12;
      const frets = shape.map((f) => f + offset);
      const suffix =
        quality === "major" ? "" : quality === "minor" ? "m" : quality;
      const entry = make(names[root] + suffix, instrument, quality, frets);
      const actual = new Set(pitches(instrument, frets).map((p) => p % 12));
      const expected = qualities[quality].map((i) => (root + i) % 12);
      if (
        !validate(instrument, frets, entry.fingers) &&
        actual.size === expected.length &&
        expected.every((n) => actual.has(n))
      )
        library.push(entry);
    }
const open: Record<string, [string, number[]]> = {
  C: ["major", [-1, 3, 2, 0, 1, 0]],
  Am: ["minor", [-1, 0, 2, 2, 1, 0]],
  G: ["major", [3, 2, 0, 0, 0, 3]],
  D: ["major", [-1, -1, 0, 2, 3, 2]],
  A: ["major", [-1, 0, 2, 2, 2, 0]],
  Dm: ["minor", [-1, -1, 0, 2, 3, 1]],
};
for (const [name, [quality, frets]] of Object.entries(open)) {
  const e = make(name, "guitar", quality, frets);
  if (!validate("guitar", frets, e.fingers)) library.unshift(e);
}
export function search(query: string, instrument: Instrument, quality: string) {
  const aliases: Record<string, string> = {
    Db: "C#",
    "D#": "Eb",
    Gb: "F#",
    "G#": "Ab",
    "A#": "Bb",
  };
  const normalized = query
    .trim()
    .replace(/^[A-G](?:#|b)?/, (root) => aliases[root] || root)
    .toLowerCase();
  return library.filter(
    (v) =>
      v.instrument === instrument &&
      (!quality || v.quality === quality) &&
      v.name.toLowerCase().includes(normalized),
  );
}
