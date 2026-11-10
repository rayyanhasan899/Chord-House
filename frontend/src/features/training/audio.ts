import { AudioTransport, tone } from "../../lib/audio/transport";
export class TrainingAudio {
  private transport = new AudioTransport();
  private timer: ReturnType<typeof setInterval> | null = null;
  private anchor = 0;
  private audioAnchor = 0;
  private limit = 0;
  private running = false;
  onTick?: (seconds: number) => void;
  onEnded?: () => void;
  onInterrupted?: (message: string) => void;
  elapsed() {
    if (!this.running) return 0;
    const seconds = this.transport.context
      ? this.transport.context.currentTime - this.audioAnchor
      : (performance.now() - this.anchor) / 1000;
    return Math.max(0, Math.min(this.limit, seconds));
  }
  active() {
    return this.running;
  }
  stop() {
    this.running = false;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.transport.stop();
  }
  async start(
    notes: number[][],
    interval: number,
    limit: number,
    audible: boolean,
  ) {
    this.stop();
    if (
      !notes.length ||
      notes.some(
        (ns) =>
          !ns.length || ns.some((n) => !Number.isFinite(n) || n < 0 || n > 127),
      ) ||
      interval < 0.2 ||
      interval > 30 ||
      !Number.isFinite(interval) ||
      !Number.isFinite(limit) ||
      limit < 0.2 ||
      limit > 3600
    )
      throw new Error("Invalid training settings");
    this.limit = limit;
    const tick = () => {
      const elapsed = this.elapsed();
      this.onTick?.(elapsed);
      if (elapsed >= limit) {
        this.stop();
        this.onEnded?.();
      }
    };
    this.running = true;
    this.anchor = performance.now();
    if (!audible) {
      this.timer = setInterval(tick, 100);
      return;
    }
    this.transport.onInterrupted = (message) => {
      this.stop();
      this.onInterrupted?.(message);
    };
    try {
      await this.transport.start((context) => {
        this.audioAnchor = context.currentTime + 0.05;
        let step = 0,
          lastDraw = -1;
        return {
          schedule: () => {
            // Skip missed cues after a stall instead of replaying a burst.
            step = Math.max(
              step,
              Math.ceil(
                Math.max(0, context.currentTime - this.audioAnchor) / interval,
              ),
            );
            while (
              this.audioAnchor + step * interval < context.currentTime + 0.15 &&
              step * interval < limit
            ) {
              const at = this.audioAnchor + step * interval;
              const chord = notes[step % notes.length];
              chord.forEach((note) =>
                tone(
                  context,
                  context.destination,
                  at,
                  440 * 2 ** ((note - 69) / 12),
                  0.12 / chord.length,
                  Math.min(0.3, interval * 0.8),
                ),
              );
              step++;
            }
          },
          draw: () => {
            const bucket = Math.floor(this.elapsed() * 10);
            if (bucket !== lastDraw) {
              lastDraw = bucket;
              tick();
            }
          },
        };
      });
    } catch (error) {
      this.stop();
      throw error;
    }
  }
}
export class EarAudio {
  private transport = new AudioTransport();
  onInterrupted?: (message: string) => void;
  stop() {
    this.transport.stop();
  }
  async play(notes: number[], sequential: boolean) {
    if (
      !notes.length ||
      notes.length > 8 ||
      notes.some((n) => !Number.isInteger(n) || n < 0 || n > 127)
    )
      throw new Error("Invalid generated tones");
    this.transport.onInterrupted = (message) => this.onInterrupted?.(message);
    await this.transport.start((context) => {
      const start = context.currentTime + 0.04;
      notes.forEach((note, index) =>
        tone(
          context,
          context.destination,
          start + (sequential ? index * 0.7 : 0),
          440 * 2 ** ((note - 69) / 12),
          0.12 / Math.max(1, sequential ? 1 : notes.length),
          0.6,
        ),
      );
      const end = start + (sequential ? (notes.length - 1) * 0.7 : 0) + 0.7;
      return {
        schedule: () => {
          if (context.currentTime >= end) this.stop();
        },
        draw: () => {},
      };
    });
  }
}
