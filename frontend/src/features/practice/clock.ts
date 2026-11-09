import type { PracticeSession } from "./types";
export function secondsAt(
  session: Pick<
    PracticeSession,
    "state" | "duration_seconds" | "target_seconds"
  >,
  sinceResponseMs: number,
) {
  const seconds =
    session.duration_seconds +
    (session.state === "active" ? Math.max(0, sinceResponseMs) / 1000 : 0);
  return Math.min(seconds, session.target_seconds ?? Infinity);
}
export function clockText(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  return [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
export function routinePosition(seconds: number, durations: number[]) {
  let elapsed = Math.max(0, seconds);
  for (let index = 0; index < durations.length; index++) {
    if (elapsed < durations[index])
      return { index, remaining: durations[index] - elapsed };
    elapsed -= durations[index];
  }
  return { index: durations.length, remaining: 0 };
}
export function localInput(instant: string) {
  const date = new Date(instant);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 19);
}
