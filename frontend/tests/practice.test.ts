import { describe, it, expect } from "vitest";
import {
  clockText,
  routinePosition,
  secondsAt,
} from "../src/features/practice/clock";

describe("server-anchored practice clock", () => {
  it("restores elapsed server time, clamps countdowns and excludes pauses", () => {
    const running = {
      state: "active" as const,
      duration_seconds: 40,
      target_seconds: 60,
    };
    expect(secondsAt(running, 5000)).toBe(45);
    expect(secondsAt(running, 9_000_000)).toBe(60);
    expect(secondsAt({ ...running, state: "paused" }, 9_000_000)).toBe(40);
    expect(secondsAt({ ...running, state: "ended" }, 9_000_000)).toBe(40);
    expect(secondsAt({ ...running, target_seconds: null }, 9_000_000)).toBe(
      9040,
    );
    expect(secondsAt(running, -100)).toBe(40);
  });
  it("advances routines at exact boundaries and formats long durations", () => {
    expect(routinePosition(29.5, [30, 60])).toEqual({
      index: 0,
      remaining: 0.5,
    });
    expect(routinePosition(30, [30, 60])).toEqual({ index: 1, remaining: 60 });
    expect(routinePosition(90, [30, 60])).toEqual({ index: 2, remaining: 0 });
    expect(clockText(3661.9)).toBe("01:01:01");
    expect(clockText(-2)).toBe("00:00:00");
  });
});
