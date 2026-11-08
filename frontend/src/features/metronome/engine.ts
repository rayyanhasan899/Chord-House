import { AudioTransport, tone } from "@/lib/audio/transport";
import { BeatTimeline, type Tick, validBpm } from "./timeline";
export type Options = {
  bpm: number;
  beats: number;
  accent: boolean;
  sound: "click" | "wood";
  volume: number;
};
export class MetronomeAudio {
  private transport = new AudioTransport();
  private gain: GainNode | null = null;
  private options: Options = {
    bpm: 100,
    beats: 4,
    accent: true,
    sound: "click",
    volume: 0.5,
  };
  onBeat?: (beat: number) => void;
  onInterrupted?: (message: string) => void;
  configure(options: Options) {
    if (
      !validBpm(options.bpm) ||
      !Number.isFinite(options.volume) ||
      !Number.isInteger(options.beats) ||
      options.beats < 1 ||
      options.beats > 12 ||
      options.volume < 0 ||
      options.volume > 1
    )
      throw new RangeError("Invalid tempo or volume");
    this.options = { ...options };
    if (this.transport.context && this.gain)
      this.gain.gain.setTargetAtTime(
        options.volume,
        this.transport.context.currentTime,
        0.01,
      );
  }
  stop() {
    this.transport.stop();
    this.gain = null;
  }
  async start() {
    this.transport.onInterrupted = (message) => this.onInterrupted?.(message);
    await this.transport.start((context) => {
      const gain = context.createGain();
      this.gain = gain;
      gain.gain.value = this.options.volume;
      gain.connect(context.destination);
      const timeline = new BeatTimeline();
      timeline.reset(context.currentTime + 0.05);
      const queue: Tick[] = [];
      return {
        schedule: () => {
          const events = timeline.due(
            context.currentTime,
            this.options.bpm,
            this.options.beats,
          );
          if (timeline.resynced)
            this.onInterrupted?.(
              "Browser scheduling was delayed; missed clicks were skipped, not played in a burst.",
            );
          for (const event of events) {
            const accented = this.options.accent && event.beat === 0;
            tone(
              context,
              gain,
              event.time,
              this.options.sound === "wood"
                ? accented
                  ? 1200
                  : 800
                : accented
                  ? 1760
                  : 880,
              accented ? 0.25 : 0.14,
              0.05,
              this.options.sound === "wood" ? "triangle" : "sine",
            );
            queue.push(event);
          }
        },
        draw: () => {
          let latest: Tick | undefined;
          while (queue.length && queue[0].time <= context.currentTime)
            latest = queue.shift();
          if (latest) this.onBeat?.(latest.beat);
        },
      };
    });
  }
}
