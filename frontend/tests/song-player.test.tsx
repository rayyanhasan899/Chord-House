import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SongPlayer, formatTime } from "../src/features/songs/song-player";

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("changing songs releases old media and resets timing without stale play errors", async () => {
  let reject!: (reason: Error) => void;
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(
    () =>
      new Promise<void>((_, fail) => {
        reject = fail;
      }),
  );
  const pause = vi
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(() => {});
  const load = vi
    .spyOn(HTMLMediaElement.prototype, "load")
    .mockImplementation(() => {});
  const view = render(
    <SongPlayer src="/first.mp3" title="First" artist="Artist" />,
  );
  const original = view.container.querySelector("audio")!;
  Object.defineProperty(original, "duration", {
    value: 180,
    configurable: true,
  });
  fireEvent.loadedMetadata(original);
  fireEvent.click(screen.getByRole("button", { name: "Play song" }));
  view.rerender(
    <SongPlayer src="/second.mp3" title="Second" artist="Artist" />,
  );
  reject(new Error("old request aborted"));
  await Promise.resolve();
  expect(pause).toHaveBeenCalled();
  expect(load).toHaveBeenCalled();
  expect(original).not.toHaveAttribute("src");
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("slider", { name: "Seek in song" })).toBeDisabled();
  expect(view.container.querySelector("audio")).toHaveAttribute(
    "src",
    "/second.mp3",
  );
});

test("multiple players have independent accessible seek labels", () => {
  render(
    <>
      <SongPlayer src="/one.mp3" title="One" artist="Artist" />
      <SongPlayer src="/two.mp3" title="Two" artist="Artist" />
    </>,
  );
  const controls = screen.getAllByRole("slider", { name: "Seek in song" });
  expect(controls).toHaveLength(2);
  expect(controls[0].id).not.toBe(controls[1].id);
});
function setup() {
  const view = render(
    <SongPlayer src="/recording.mp3" title="Example" artist="Artist" />,
  );
  const audio = view.container.querySelector("audio")!;
  Object.defineProperty(audio, "duration", { configurable: true, value: 180 });
  fireEvent.loadedMetadata(audio);
  return audio;
}

test("time formatting handles unknown duration and long tracks", () => {
  expect(formatTime(NaN)).toBe("0:00");
  expect(formatTime(Infinity)).toBe("0:00");
  expect(formatTime(185)).toBe("3:05");
});

test("play, pause and ended events keep controls accurate", async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(() => {});
  const audio = setup();
  fireEvent.click(screen.getByRole("button", { name: "Play song" }));
  expect(play).toHaveBeenCalled();
  Object.defineProperty(audio, "paused", { configurable: true, value: false });
  fireEvent.play(audio);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Pause song" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Pause song" }));
  expect(pause).toHaveBeenCalled();
  fireEvent.ended(audio);
  expect(screen.getByRole("button", { name: "Play song" })).toBeInTheDocument();
});

test("seeking and skip controls stay within track bounds", () => {
  const audio = setup();
  fireEvent.change(screen.getByRole("slider", { name: "Seek in song" }), {
    target: { value: "175" },
  });
  expect(audio.currentTime).toBe(175);
  fireEvent.click(screen.getByRole("button", { name: "Forward 10 seconds" }));
  expect(audio.currentTime).toBe(180);
  fireEvent.change(screen.getByRole("slider", { name: "Seek in song" }), {
    target: { value: "5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Rewind 10 seconds" }));
  expect(audio.currentTime).toBe(0);
});

test("volume and repeat control the actual audio element", () => {
  const audio = setup();
  fireEvent.change(screen.getByRole("slider", { name: "Volume" }), {
    target: { value: "0.3" },
  });
  expect(audio.volume).toBe(0.3);
  fireEvent.click(screen.getByRole("button", { name: "Repeat off" }));
  expect(audio.loop).toBe(true);
  expect(screen.getByRole("button", { name: "Repeat on" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("failed recordings produce readable feedback", () => {
  const audio = setup();
  fireEvent.error(audio);
  expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");
});
