import { test, expect } from "vitest";
import {
  question,
  sequencePosition,
  randomized,
  fretNote,
  trainingVoicings,
} from "../src/features/training/domain";
test("duplicate chord names retain the selected difficulty and lowest-fret shape", () => {
  const open = {
    name: "C",
    difficulty: "beginner",
    frets: [-1, 3, 2, 0, 1, 0],
  };
  const high = {
    name: "C",
    difficulty: "beginner",
    frets: [8, 10, 10, 9, 8, 8],
  };
  const barre = { ...high, difficulty: "intermediate" };
  const g = { name: "G", difficulty: "beginner", frets: [3, 2, 0, 0, 0, 3] };
  expect(trainingVoicings([open, g, high, barre], "beginner")).toEqual([
    open,
    g,
  ]);
  expect(trainingVoicings([barre, g, high, open], "beginner")).toEqual([
    open,
    g,
  ]);
  expect(trainingVoicings([open, g, barre], "intermediate")).toEqual([
    barre,
    g,
  ]);
});
for (const level of ["beginner", "intermediate", "advanced"] as const)
  for (const mode of ["note", "interval", "quality"] as const) {
    test(`${level} ${mode} generated questions stay playable and include their answer`, () => {
      for (const sample of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const q = question(mode, level, () => sample);
        expect(q.options).toContain(q.answer);
        expect(q.explanation.length).toBeGreaterThan(20);
        expect(
          q.notes.every((n) => Number.isInteger(n) && n >= 36 && n <= 96),
        ).toBe(true);
        expect(new Set(q.options).size).toBe(q.options.length);
      }
    });
  }
test("known generated interval and chord quality have correct pitch offsets", () => {
  expect(question("interval", "beginner", () => 0).notes).toEqual([60, 60]);
  expect(question("interval", "beginner", () => 0.999).notes).toEqual([60, 72]);
  expect(question("quality", "beginner", () => 0).notes).toEqual([60, 64, 67]);
  expect(question("quality", "beginner", () => 0.99).notes).toEqual([
    60, 63, 67,
  ]);
});
test("sequence timing skips ahead rather than losing current/next chord on a stall", () => {
  expect(sequencePosition(0, 2, 3)).toEqual({ current: 0, next: 1, step: 0 });
  expect(sequencePosition(2, 2, 3)).toEqual({ current: 1, next: 2, step: 1 });
  expect(sequencePosition(31, 2, 3)).toEqual({ current: 0, next: 1, step: 15 });
  expect(() => sequencePosition(0, 0, 2)).toThrow();
});
test("random sequences avoid immediate repetitions and require enough choices", () => {
  const selected = randomized(["C", "G", "Am"], 8, () => 0);
  expect(selected.every((n, i) => i === 0 || selected[i - 1] !== n)).toBe(true);
  expect(() => randomized(["C"], 2)).toThrow();
  expect(() => randomized(["C", "G"], 2.5)).toThrow();
});
test("fret mapping respects standard bass and re-entrant ukulele", () => {
  expect(fretNote(40, 0).name).toBe("E2");
  expect(fretNote(28, 12).name).toBe("E2");
  expect(fretNote(67, 2)).toEqual({ name: "A4", midi: 69, hz: 440 });
  expect(() => fretNote(40, 25)).toThrow();
  expect(() => fretNote(40, -1)).toThrow();
});
