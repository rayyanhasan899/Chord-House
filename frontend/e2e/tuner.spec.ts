import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
test("guest tuner requests only on action, detects generated reference and releases capture", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    const activeContexts: AudioContext[] = [];
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        activeContexts.push(this);
      }
    };
    document.addEventListener("DOMContentLoaded", () => {
      document.body.dataset.captures = "0";
      document.body.dataset.stops = "0";
    });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        document.body.dataset.captures = String(
          Number(document.body.dataset.captures || 0) + 1,
        );
        const context = activeContexts.at(-1) || new Native();
        await context.resume();
        const oscillator = context.createOscillator();
        oscillator.frequency.value = 82.406889;
        const destination = context.createMediaStreamDestination();
        oscillator.connect(destination);
        oscillator.start();
        const track = destination.stream.getAudioTracks()[0];
        const stop = track.stop.bind(track);
        track.stop = () => {
          document.body.dataset.stops = String(
            Number(document.body.dataset.stops || 0) + 1,
          );
          stop();
          oscillator.stop();
          if (context !== activeContexts.at(-1))
            void context.close().catch(() => {});
        };
        return destination.stream;
      },
    });
  });
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(new URL(r.url()).pathname);
  });
  await page.goto("/tuner");
  mkdirSync(resolve("../.artifacts"), { recursive: true });
  await page.screenshot({
    path: resolve("../.artifacts/phase08-tuner.png"),
    fullPage: true,
  });
  await expect(page.locator("body")).toHaveAttribute("data-captures", "0");
  await page
    .getByRole("button", { name: "Start microphone", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "In tune", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-stops", "1");
  await page
    .getByRole("button", { name: "Start microphone", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "In tune", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-stops", "2");
  expect(posts).toEqual([]);
});
test("microphone denial gives a retryable explanation", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        throw new DOMException("denied", "NotAllowedError");
      },
    });
  });
  await page.goto("/tuner");
  await page
    .getByRole("button", { name: "Start microphone", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Microphone permission denied",
  );
  await expect(
    page.getByRole("button", { name: "Start microphone", exact: true }),
  ).toBeEnabled();
});
