import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { EarAudio, TrainingAudio } from "../src/features/training/audio";
class ControlledAudio {
  static instances: ControlledAudio[] = [];
  state: AudioContextState = "suspended";
  currentTime = 0;
  destination = {};
  onstatechange: (() => void) | null = null;
  resolve!: () => void;
  reject!: (error: Error) => void;
  voices: { frequency: { value: number }; start: ReturnType<typeof vi.fn> }[] =
    [];
  constructor() {
    ControlledAudio.instances.push(this);
  }
  resume() {
    return new Promise<void>((resolve, reject) => {
      this.resolve = () => {
        this.state = "running";
        resolve();
      };
      this.reject = reject;
    });
  }
  close = vi.fn(async () => {
    this.state = "closed";
  });
  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: (node: unknown) => node,
      disconnect: vi.fn(),
    };
  }
  createOscillator() {
    const voice = {
      frequency: { value: 0 },
      type: "triangle",
      connect: (node: unknown) => node,
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      onended: null as (() => void) | null,
    };
    this.voices.push(voice);
    return voice;
  }
}
beforeEach(() => {
  vi.useFakeTimers();
  ControlledAudio.instances = [];
  vi.stubGlobal("AudioContext", ControlledAudio);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
test("a cancelled old resume cannot stop a newer training round", async () => {
  const audio = new TrainingAudio();
  const first = audio.start([[60], [67]], 1, 10, true);
  const old = ControlledAudio.instances[0];
  audio.stop();
  const second = audio.start([[60], [67]], 1, 10, true);
  const latest = ControlledAudio.instances[1];
  latest.resolve();
  await second;
  expect(audio.active()).toBe(true);
  old.reject(new Error("Old resume cancelled"));
  await expect(first).rejects.toThrow("Old resume cancelled");
  expect(latest.close).not.toHaveBeenCalled();
  expect(audio.active()).toBe(true);
  audio.stop();
  expect(latest.close).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
test("stopping during resume never creates a late cue or timer", async () => {
  const audio = new TrainingAudio();
  const pending = audio.start([[60], [67]], 1, 10, true);
  const context = ControlledAudio.instances[0];
  audio.stop();
  context.resolve();
  await pending;
  expect(context.voices).toHaveLength(0);
  expect(audio.active()).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});
test("ear tones use exact generated pitches and close after playback", async () => {
  const audio = new EarAudio();
  const pending = audio.play([60, 72], true);
  const context = ControlledAudio.instances[0];
  context.resolve();
  await pending;
  expect(context.voices[0].frequency.value).toBeCloseTo(261.625565, 5);
  expect(context.voices[1].frequency.value).toBeCloseTo(523.251131, 5);
  expect(context.voices[0].start).toHaveBeenCalledWith(0.04);
  expect(context.voices[1].start).toHaveBeenCalledWith(0.74);
  context.currentTime = 2;
  vi.advanceTimersByTime(25);
  expect(context.close).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
