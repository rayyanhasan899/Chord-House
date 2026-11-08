import { test, expect } from "vitest";
import { validateRhythm, countLabel } from "../src/features/patterns/rhythm";
import { BeatTimeline } from "../src/features/metronome/timeline";
const rhythm = {
  meter: "4/4",
  subdivision: 2,
  strokes: [..."DRDURUDU"],
  tempo_min: 60,
  tempo_max: 140,
};
test("pattern validation rejects incomplete silent unknown and invalid rhythms", () => {
  expect(validateRhythm(rhythm)).toBe("");
  for (const patch of [
    { strokes: ["D"] },
    { strokes: Array(8).fill("R") },
    { strokes: [..."DRDURUZU"] },
    { subdivision: 3 },
    { meter: "5/4" },
    { tempo_min: 150 },
    { tempo_max: 301 },
  ])
    expect(validateRhythm({ ...rhythm, ...patch })).not.toBe("");
});
for (const meter of ["2/4", "3/4", "4/4", "6/8"])
  for (const subdivision of [1, 2, 4])
    test(`${meter} subdivision ${subdivision} stays synchronized for five minutes`, () => {
      const t = new BeatTimeline();
      t.reset(0.05);
      const beats = Number(meter[0]);
      const all: { time: number; beat: number }[] = [];
      for (let now = 0; now < 300; now += 0.025)
        all.push(...t.due(now, 120, beats, subdivision));
      for (let i = 0; i < all.length; i++) {
        expect(all[i].beat).toBe(i % (beats * subdivision));
        expect(
          Math.abs(all[i].time - (0.05 + (i * 0.5) / subdivision)),
        ).toBeLessThan(1e-8);
      }
    });
test("readable beat and sixteenth counts", () => {
  expect([0, 1, 2, 3, 4].map((i) => countLabel(i, 4))).toEqual([
    "1",
    "1 e",
    "1 &",
    "1 a",
    "2",
  ]);
  expect(countLabel(3, 2)).toBe("2 &");
});
