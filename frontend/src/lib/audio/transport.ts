export type AudioRun = { schedule: () => void; draw: () => void };
/** Owns one lookahead timer, visual frame, context and cancellation. */
export class AudioTransport {
  context: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame: number | null = null;
  private version = 0;
  onInterrupted?: (message: string) => void;
  stop() {
    this.version++;
    if (this.timer !== null) clearInterval(this.timer);
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.timer = null;
    this.frame = null;
    const context = this.context;
    this.context = null;
    if (context) {
      context.onstatechange = null;
      void context.close().catch(() => {});
    }
  }
  async start(initialize: (context: AudioContext) => AudioRun) {
    this.stop();
    const turn = this.version;
    if (!window.AudioContext)
      throw new Error("Web Audio is unavailable in this browser.");
    const context = new AudioContext();
    this.context = context;
    try {
      await resumeAudio(context);
      if (turn !== this.version) return;
      if (context.state !== "running")
        throw new Error("Audio could not resume. Try Start again.");
      context.onstatechange = () => {
        if (this.context === context && context.state !== "running") {
          this.stop();
          this.onInterrupted?.(
            "Audio paused or interrupted. Press Start to resume.",
          );
        }
      };
      const run = initialize(context);
      const schedule = () => {
        if (this.context !== context) return;
        try {
          run.schedule();
        } catch {
          this.stop();
          this.onInterrupted?.(
            "Audio paused after a playback error. Press Start to retry.",
          );
        }
      };
      const draw = () => {
        if (this.context !== context) return;
        run.draw();
        if (this.context === context) this.frame = requestAnimationFrame(draw);
      };
      schedule();
      if (this.context === context) {
        this.timer = setInterval(schedule, 25);
        this.frame = requestAnimationFrame(draw);
      }
    } catch (error) {
      if (turn === this.version) this.stop();
      throw error;
    }
  }
}
export function tone(
  context: AudioContext,
  destination: AudioNode,
  at: number,
  frequency: number,
  volume: number,
  duration: number,
  type: OscillatorType = "triangle",
) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(volume, at + 0.002);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration - 0.005);
  oscillator.connect(envelope).connect(destination);
  oscillator.start(at);
  oscillator.stop(at + duration);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
  };
}
import { resumeAudio } from "./resume";
