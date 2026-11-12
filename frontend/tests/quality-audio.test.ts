import { expect, test } from "vitest";
import { cents, detect, frequency } from "../src/features/tuner/pitch";
import { BeatTimeline } from "../src/features/metronome/timeline";

// Original deterministic fixtures, not recordings or licensed song content.
function pluck(hz: number, rate: number, offset: number, seed: number) {
  let state = seed;
  return Float32Array.from({ length: 8192 }, (_, index) => {
    state = (state * 16807) % 2147483647;
    const t = offset + index / rate;
    const phase = 2 * Math.PI * hz * t;
    return (
      Math.exp(-t * 0.7) *
        (0.18 * Math.sin(phase) +
          0.28 * Math.sin(2 * phase) +
          0.1 * Math.sin(3 * phase)) +
      (state / 2147483647 - 0.5) * 0.012 +
      0.025 // DC offset from a non-ideal capture path.
    );
  });
}

const errors: number[] = [];
for (const midi of [28, 33, 38, 40, 45, 50, 55, 59, 64, 69])
  for (const rate of [32000, 44100, 48000, 96000])
    test(`noisy harmonic pluck MIDI ${midi} at ${rate} Hz after attack and decay`, () => {
      for (const time of [0.15, 1.5]) {
        const hz = frequency(midi);
        const result = detect(pluck(hz, rate, time, 18), rate);
        expect(result.hz).not.toBeNull();
        const error = Math.abs(cents(result.hz!, hz));
        errors.push(error);
        expect(error).toBeLessThan(5);
      }
    });

test("historically reported low guitar readings are measured honestly", () => {
  // No arbitrary calibration offset is inferred from approximate user readings.
  for (const hz of [81.3, 81.8, 82.406889, 109.2, 109.8, 110]) {
    const result = detect(pluck(hz, 48000, 0.3, 123), 48000);
    expect(result.hz).not.toBeNull();
    expect(Math.abs(cents(result.hz!, hz))).toBeLessThan(5);
  }
  console.log(
    `Noisy pluck maximum absolute error: ${Math.max(...errors)} cents`,
  );
});

test("thirty minute timing through deterministic timer jitter without drift", () => {
  for (const bpm of [30, 120, 300]) {
    const timeline = new BeatTimeline();
    timeline.reset(0.05);
    let count = 0;
    let maximum = 0;
    for (let now = 0; now < 1800; now += 0.017 + (count % 4) * 0.003) {
      for (const tick of timeline.due(now, bpm, 4)) {
        maximum = Math.max(
          maximum,
          Math.abs(tick.time - (0.05 + (count * 60) / bpm)),
        );
        expect(tick.beat).toBe(count % 4);
        count++;
      }
      expect(timeline.resynced).toBe(false);
    }
    expect(count).toBeGreaterThanOrEqual((1800 * bpm) / 60);
    expect(maximum).toBeLessThan(1e-6);
    console.log(`Timeline ${bpm} BPM: ${count} ticks, ${maximum}s phase error`);
  }
});
