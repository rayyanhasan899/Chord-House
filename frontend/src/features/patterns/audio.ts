import { AudioTransport, tone } from "@/lib/audio/transport";
import {
  BeatTimeline,
  type Tick,
  validBpm,
} from "@/features/metronome/timeline";
import { validateRhythm, type Rhythm } from "./rhythm";
export class PatternAudio {
  private transport = new AudioTransport();
  onStep?: (step: number) => void;
  onEnded?: () => void;
  onInterrupted?: (message: string) => void;
  stop() {
    this.transport.stop();
  }
  async play(
    pattern: Rhythm,
    bpm: number,
    notes: number[],
    loop: boolean,
    accent: boolean,
    metronome: boolean,
    volume: number,
  ) {
    const error = validateRhythm(pattern);
    if (
      error ||
      !validBpm(bpm) ||
      !notes.length ||
      notes.some((n) => !Number.isFinite(n) || n < 0 || n > 127) ||
      !Number.isFinite(volume) ||
      volume < 0 ||
      volume > 1
    )
      throw new Error(error || "Invalid playback settings");
    this.transport.onInterrupted = (message) => this.onInterrupted?.(message);
    await this.transport.start((context) => {
      const gain = context.createGain();
      gain.gain.value = volume;
      gain.connect(context.destination);
      const timeline = new BeatTimeline();
      timeline.reset(context.currentTime + 0.05);
      const queue: Tick[] = [];
      const beats = Number(pattern.meter[0]);
      const end = timeline.next + (beats * 60) / bpm;
      return {
        schedule: () => {
          const events = timeline.due(
            context.currentTime,
            bpm,
            beats,
            pattern.subdivision,
          );
          if (timeline.resynced)
            this.onInterrupted?.(
              "Browser scheduling was delayed; missed strokes were skipped.",
            );
          for (const event of events) {
            if (!loop && event.time >= end - 0.00001) continue;
            const stroke = pattern.strokes[event.beat];
            const beat = event.beat / pattern.subdivision;
            const strong =
              accent && (beat === 0 || (pattern.meter === "6/8" && beat === 3));
            const duration = Math.min(
              0.22,
              (60 / bpm / pattern.subdivision) * 0.8,
            );
            if (metronome && event.beat % pattern.subdivision === 0)
              tone(
                context,
                gain,
                event.time,
                strong ? 1760 : 880,
                0.1,
                0.05,
                "sine",
              );
            if (stroke === "X")
              tone(context, gain, event.time, 130, strong ? 0.18 : 0.1, 0.04);
            else if (stroke !== "R") {
              const ordered = stroke === "U" ? [...notes].reverse() : notes;
              ordered.forEach((midi, i) =>
                tone(
                  context,
                  gain,
                  event.time + i * Math.min(0.008, duration / notes.length / 2),
                  440 * 2 ** ((midi - 69) / 12),
                  (strong ? 0.34 : 0.2) / notes.length,
                  duration,
                ),
              );
            }
            queue.push(event);
          }
        },
        draw: () => {
          let latest: Tick | undefined;
          while (queue.length && queue[0].time <= context.currentTime)
            latest = queue.shift();
          if (latest) this.onStep?.(latest.beat);
          if (!loop && context.currentTime >= end + 0.25) {
            this.stop();
            this.onEnded?.();
          }
        },
      };
    });
  }
}
