import { afterEach, expect, test, vi } from "vitest";
import { resumeAudio } from "../src/lib/audio/resume";

afterEach(() => vi.useRealTimers());

test("a missing audio device cannot leave startup waiting indefinitely", async () => {
  vi.useFakeTimers();
  const context = {
    state: "suspended",
    resume: () => new Promise<void>(() => {}),
  } as unknown as AudioContext;
  const failure = expect(resumeAudio(context)).rejects.toThrow(
    "Check your audio device",
  );
  await vi.advanceTimersByTimeAsync(5000);
  await failure;
  expect(vi.getTimerCount()).toBe(0);
});

test("successful startup clears the timeout and suspended startup gives recovery", async () => {
  vi.useFakeTimers();
  const context = {
    state: "running",
    resume: async () => {},
  } as unknown as AudioContext;
  await resumeAudio(context);
  expect(vi.getTimerCount()).toBe(0);
  await expect(
    resumeAudio({ ...context, state: "suspended" } as AudioContext),
  ).rejects.toThrow("press Start to retry");
  expect(vi.getTimerCount()).toBe(0);
});
