export const presets = {
  "Guitar standard": [40, 45, 50, 55, 59, 64],
  "Guitar Drop D": [38, 45, 50, 55, 59, 64],
  "Guitar DADGAD": [38, 45, 50, 55, 57, 62],
  "Bass standard": [28, 33, 38, 43],
  "Ukulele re-entrant": [67, 60, 64, 69],
};
export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export const cents = (hz: number, target: number) =>
  1200 * Math.log2(hz / target);
export function note(midi: number) {
  return (
    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][
      ((midi % 12) + 12) % 12
    ] +
    (Math.floor(midi / 12) - 1)
  );
}
export function detect(
  input: Float32Array,
  rate: number,
): { hz: number | null; rms: number; confidence: number } {
  let power = 0;
  for (const x of input) power += x * x;
  const rms = Math.sqrt(power / input.length);
  if (rms < 0.003 || !Number.isFinite(rms))
    return { hz: null, rms, confidence: 0 };
  const step = 4;
  const sample = new Float32Array(Math.floor(input.length / step));
  for (let i = 0; i < sample.length; i++) {
    let total = 0;
    for (let j = 0; j < step; j++) total += input[i * step + j];
    sample[i] = total / step;
  }
  const sr = rate / step;
  const max = Math.min(Math.floor(sr / 30), Math.floor(sample.length / 2));
  const length = sample.length - max;
  const diff = new Float64Array(max + 1);
  let sum = 0;
  diff[0] = 1;
  for (let tau = 1; tau <= max; tau++) {
    let value = 0;
    for (let i = 0; i < length; i++) {
      const delta = sample[i] - sample[i + tau];
      value += delta * delta;
    }
    sum += value;
    diff[tau] = sum ? (value * tau) / sum : 1;
  }
  for (let tau = Math.max(2, Math.floor(sr / 1100)); tau < max - 1; tau++) {
    if (diff[tau] < 0.12) {
      while (tau + 1 < max && diff[tau + 1] < diff[tau]) tau++;
      const denominator = diff[tau - 1] - 2 * diff[tau] + diff[tau + 1];
      const offset = denominator
        ? (diff[tau - 1] - diff[tau + 1]) / (2 * denominator)
        : 0;
      return { hz: sr / (tau + offset), rms, confidence: 1 - diff[tau] };
    }
  }
  return { hz: null, rms, confidence: 0 };
}
