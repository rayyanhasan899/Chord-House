import { test, expect } from "vitest";
import {
  BeatTimeline,
  tapTempo,
  validBpm,
} from "../src/features/metronome/timeline";
for (const bpm of [30, 60, 120, 300])
  test(`five minute schedule at ${bpm} BPM`, () => {
    const t = new BeatTimeline();
    t.reset(0.05);
    const all: { time: number; beat: number }[] = [];
    for (let now = 0; now < 300; now += 0.025) {
      all.push(...t.due(now, bpm, 4));
      expect(t.resynced).toBe(false);
    }
    expect(all.length).toBeGreaterThan(140);
    for (let i = 0; i < all.length; i++) {
      expect(Math.abs(all[i].time - (0.05 + (i * 60) / bpm))).toBeLessThan(
        1e-8,
      );
      expect(all[i].beat).toBe(i % 4);
    }
  });
test("late scheduler skips rather than bursting", () => {
  const t = new BeatTimeline();
  t.reset(0.05);
  t.due(0, 120, 4);
  const events = t.due(10, 120, 4);
  expect(t.resynced).toBe(true);
  expect(events.every((e) => e.time > 10)).toBe(true);
  expect(events.length).toBeLessThan(2);
});
test("tap tempo and limits", () => {
  expect(tapTempo([0, 500, 1000, 1500])).toBe(120);
  expect(tapTempo([100, 110])).toBeNull();
  expect(tapTempo([0, 3000])).toBeNull();
  expect(tapTempo([10])).toBeNull();
  for (const invalid of [0, 29, 301, NaN, 99.5])
    expect(validBpm(invalid)).toBe(false);
  expect(validBpm(30)).toBe(true);
  expect(validBpm(300)).toBe(true);
});

// A 200ms foreground stall previously skipped a beat with the 150ms horizon.
test("foreground stall within the audio buffer preserves every scheduled beat", () => {
  const timeline = new BeatTimeline();
  timeline.reset(0.05);
  const events = [];
  for (const now of [0, 0.025, 0.225, 0.25, 0.275, 0.3, 0.325, 0.35]) {
    events.push(...timeline.due(now, 300, 4));
    expect(timeline.resynced).toBe(false);
  }
  for (let i = 0; i < events.length; i++)
    expect(events[i].time).toBeCloseTo(0.05 + i * 0.2, 9);
});
