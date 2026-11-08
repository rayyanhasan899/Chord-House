import { test, expect } from "vitest";
import { detect, cents, frequency, presets } from "../src/features/tuner/pitch";
function signal(hz: number, rate: number, harmonics = false) {
  return Float32Array.from(
    { length: 8192 },
    (_, i) =>
      0.2 * Math.sin((2 * Math.PI * hz * i) / rate) +
      (harmonics
        ? 0.35 * Math.sin((4 * Math.PI * hz * i) / rate) +
          0.15 * Math.sin((6 * Math.PI * hz * i) / rate)
        : 0),
  );
}
for (const midi of [...new Set(Object.values(presets).flat())])
  for (const rate of [44100, 48000])
    for (const harmonic of [false, true])
      test(`reference ${midi} ${rate} harmonic=${harmonic}`, () => {
        const hz = frequency(midi);
        const r = detect(signal(hz, rate, harmonic), rate);
        expect(r.hz).not.toBeNull();
        expect(Math.abs(cents(r.hz!, hz))).toBeLessThan(5);
      });
test("silence weak signals and deterministic noise rejected", () => {
  expect(detect(new Float32Array(8192), 48000).hz).toBeNull();
  let state = 12345;
  const noise = Float32Array.from({ length: 8192 }, () => {
    state = (state * 16807) % 2147483647;
    return (state / 2147483647 - 0.5) * 0.5;
  });
  expect(detect(noise, 48000).hz).toBeNull();
  expect(
    detect(
      signal(41.20344, 48000).map((x) => x * 0.001),
      48000,
    ).hz,
  ).toBeNull();
});
test("independent reference and cents direction", () => {
  const r = detect(signal(440, 48000), 48000);
  expect(r.hz).toBeCloseTo(440, 0);
  expect(cents(450, 440)).toBeGreaterThan(0);
  expect(cents(430, 440)).toBeLessThan(0);
});
