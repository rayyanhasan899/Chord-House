import { expect, test } from "vitest";
import { transposeChord, capoAdvice } from "../src/features/songs/music";
for (const root of [
  "C",
  "C#",
  "Db",
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
]) {
  for (const quality of [
    "",
    "m",
    "7",
    "maj7",
    "m7",
    "dim",
    "aug",
    "sus2",
    "sus4",
  ]) {
    test(`transpose ${root}${quality} preserves quality and slash bass through every offset`, () => {
      const chord = root + quality + "/G";
      for (let offset = -12; offset <= 12; offset++) {
        const changed = transposeChord(chord, offset, true);
        expect(changed).toContain(quality + "/");
        expect(transposeChord(changed, -offset, false)).toBe(
          transposeChord(chord, 0, false),
        );
      }
      expect(chord).toBe(root + quality + "/G");
    });
  }
}
test("accidentals, quality and capo limits are explicit", () => {
  expect(transposeChord("Bbmaj7/F", 2, false)).toBe("Cmaj7/G");
  expect(transposeChord("C#m7", 0, true)).toBe("Dbm7");
  expect(() => transposeChord("Cbad", 1, false)).toThrow();
  expect(capoAdvice("guitar", "standard", 0, "C", 2)).toContain("capo 2");
  expect(capoAdvice("guitar", "standard", 0, "C", -1)).toContain(
    "cannot lower",
  );
  expect(capoAdvice("guitar", "dadgad", 0, "C", 2)).toContain("No reliable");
  expect(capoAdvice("ukulele", "reentrant", 0, "C", 2)).toContain(
    "No reliable",
  );
});
