import { BeatTimeline, type Tick, validBpm } from "./timeline";
export type Options = {
  bpm: number;
  beats: number;
  accent: boolean;
  sound: "click" | "wood";
  volume: number;
};
export class MetronomeAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame: number | null = null;
  private timeline = new BeatTimeline();
  private queue: Tick[] = [];
  private version = 0;
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
    if (this.context && this.gain)
      this.gain.gain.setTargetAtTime(
        options.volume,
        this.context.currentTime,
        0.01,
      );
  }
  stop() {
    this.version++;
    if (this.timer !== null) clearInterval(this.timer);
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.timer = null;
    this.frame = null;
    this.queue = [];
    const context = this.context;
    this.context = null;
    this.gain = null;
    if (context) {
      context.onstatechange = null;
      void context.close();
    }
  }
  async start() {
    this.stop();
    const turn = this.version;
    const context = new AudioContext();
    this.context = context;
    try {
      await context.resume();
      if (turn !== this.version) return;
      if (context.state !== "running")
        throw new Error("Audio could not resume. Try Start again.");
      this.gain = context.createGain();
      this.gain.gain.value = this.options.volume;
      this.gain.connect(context.destination);
      this.timeline.reset(context.currentTime + 0.05);
      context.onstatechange = () => {
        if (this.context === context && context.state !== "running") {
          this.stop();
          this.onInterrupted?.(
            "Audio paused or interrupted. Press Start to resume.",
          );
        }
      };
      const schedule = () => {
        if (this.context !== context) return;
        const events = this.timeline.due(
          context.currentTime,
          this.options.bpm,
          this.options.beats,
        );
        if (this.timeline.resynced)
          this.onInterrupted?.(
            "Browser scheduling was delayed; missed clicks were skipped, not played in a burst.",
          );
        for (const event of events) {
          const oscillator = context.createOscillator();
          const envelope = context.createGain();
          const accented = this.options.accent && event.beat === 0;
          oscillator.type = this.options.sound === "wood" ? "triangle" : "sine";
          oscillator.frequency.value =
            this.options.sound === "wood"
              ? accented
                ? 1200
                : 800
              : accented
                ? 1760
                : 880;
          envelope.gain.setValueAtTime(0, event.time);
          envelope.gain.linearRampToValueAtTime(
            accented ? 0.25 : 0.14,
            event.time + 0.002,
          );
          envelope.gain.exponentialRampToValueAtTime(
            0.0001,
            event.time + 0.045,
          );
          oscillator.connect(envelope).connect(this.gain!);
          oscillator.start(event.time);
          oscillator.stop(event.time + 0.05);
          oscillator.onended = () => {
            oscillator.disconnect();
            envelope.disconnect();
          };
          this.queue.push(event);
        }
      };
      const draw = () => {
        if (this.context !== context) return;
        let latest: Tick | undefined;
        while (this.queue.length && this.queue[0].time <= context.currentTime)
          latest = this.queue.shift();
        if (latest) this.onBeat?.(latest.beat);
        this.frame = requestAnimationFrame(draw);
      };
      schedule();
      this.timer = setInterval(schedule, 25);
      this.frame = requestAnimationFrame(draw);
    } catch (error) {
      if (turn === this.version) this.stop();
      throw error;
    }
  }
}
