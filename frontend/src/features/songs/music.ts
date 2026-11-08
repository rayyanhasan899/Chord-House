const sharp = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const flat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const pc: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  "E#": 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};
export function transposeChord(
  chord: string,
  offset: number,
  flats: boolean,
): string {
  const match =
    /^([A-G][#b]?)(m|maj7|m7|7|dim|aug|sus2|sus4)?(?:\/([A-G][#b]?))?$/.exec(
      chord,
    );
  if (!match || !Number.isInteger(offset) || Math.abs(offset) > 12)
    throw new Error("Unsupported chord or transpose offset");
  const notes = flats ? flat : sharp;
  const shift = (note: string) => notes[(((pc[note] + offset) % 12) + 12) % 12];
  return (
    shift(match[1]) + (match[2] || "") + (match[3] ? "/" + shift(match[3]) : "")
  );
}
export function capoAdvice(
  instrument: string,
  tuning: string,
  capo: number | null | undefined,
  key: string | null | undefined,
  offset: number,
) {
  if (instrument !== "guitar" || tuning !== "standard" || capo !== 0 || !key)
    return "No reliable capo calculation for this arrangement. Follow its source guidance.";
  if (offset < 0)
    return "A capo cannot lower pitch. Use the transposed chord shapes; no capo is recommended.";
  return offset === 0
    ? "Original concert chords, no capo."
    : `For this higher key, you can keep the original chord shapes with capo ${offset}. The transposed diagrams below show the alternative without a capo.`;
}
