export const MIN_BPM = 30,
  MAX_BPM = 300;
export function validBpm(bpm: number) {
  return Number.isInteger(bpm) && bpm >= MIN_BPM && bpm <= MAX_BPM;
}
export type Tick = { time: number; beat: number };
export class BeatTimeline {
  next = 0;
  index = 0;
  resynced = false;
  reset(at: number) {
    this.next = at;
    this.index = 0;
  }
  due(now: number, bpm: number, beats: number, subdivision = 1): Tick[] {
    if (!validBpm(bpm) || !Number.isInteger(beats) || beats < 1 || beats > 12)
      throw new RangeError("Invalid tempo or meter");
    if (![1, 2, 4].includes(subdivision))
      throw new RangeError("Invalid subdivision");
    const period = 60 / bpm / subdivision;
    this.resynced = false;
    if (this.next < now) {
      const missed = Math.ceil((now + 0.03 - this.next) / period);
      this.next += missed * period;
      this.index += missed;
      this.resynced = true;
    }
    const result: Tick[] = [];
    while (this.next < now + 0.15) {
      result.push({
        time: this.next,
        beat: this.index % (beats * subdivision),
      });
      this.index++;
      this.next += period;
    }
    return result;
  }
}
export function tapTempo(times: number[]): number | null {
  if (times.length < 2) return null;
  const gaps = times.slice(1).map((time, i) => time - times[i]);
  if (gaps.some((g) => g <= 0 || g > 2100)) return null;
  const bpm = Math.round(
    60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length),
  );
  return validBpm(bpm) ? bpm : null;
}
