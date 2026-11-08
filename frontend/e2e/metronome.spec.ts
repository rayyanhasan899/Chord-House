import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
declare global {
  interface Window {
    __metContexts: AudioContext[];
    __metClicks: { time: number; called: number; frequency: number }[];
  }
}
async function instrument(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.__metContexts = [];
    window.__metClicks = [];
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.__metContexts.push(this);
        const create = this.createOscillator.bind(this);
        this.createOscillator = () => {
          const oscillator = create();
          const start = oscillator.start.bind(oscillator);
          oscillator.start = (time = 0) => {
            window.__metClicks.push({
              time,
              called: this.currentTime,
              frequency: oscillator.frequency.value,
            });
            start(time);
          };
          return oscillator;
        };
      }
    };
  });
}
test("metronome controls suspension stop and navigation cleanup", async ({
  page,
}) => {
  await instrument(page);
  await page.goto("/metronome");
  await expect(
    page.getByRole("button", { name: "Start metronome", exact: true }),
  ).toBeEnabled();
  expect(await page.evaluate(() => window.__metContexts.length)).toBe(0);
  await page.getByLabel("Tempo (BPM)", { exact: true }).fill("301");
  await expect(
    page.getByRole("button", { name: "Start metronome", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Tempo (BPM)", { exact: true }).fill("120");
  await page
    .getByRole("combobox", { name: "Time signature", exact: true })
    .selectOption("3/4");
  await page
    .getByRole("combobox", { name: "Click sound", exact: true })
    .selectOption("wood");
  await page.getByLabel("Accent first beat").uncheck();
  await page.getByRole("button", { name: "Tap tempo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Tap at least twice");
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  mkdirSync(resolve("../.artifacts"), { recursive: true });
  await page.screenshot({
    path: resolve("../.artifacts/phase10-metronome.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Start metronome", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Running");
  await expect
    .poll(() => page.evaluate(() => window.__metClicks.length))
    .toBeGreaterThan(1);
  await page.evaluate(() => window.__metContexts.at(-1)!.suspend());
  await expect(page.getByRole("status")).toContainText("Audio paused");
  await expect
    .poll(() => page.evaluate(() => window.__metContexts.at(-1)!.state))
    .toBe("closed");
  await page
    .getByRole("button", { name: "Start metronome", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Running");
  await page
    .getByRole("button", { name: "Stop metronome", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.__metContexts.at(-1)!.state))
    .toBe("closed");
  const count = await page.evaluate(() => window.__metClicks.length);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__metClicks.length)).toBe(count);
  await page
    .getByRole("button", { name: "Start metronome", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Running");
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__metContexts.at(-1)!.state))
    .toBe("closed");
});
test("three minute audio scheduling remains on time through brief UI work", async ({
  page,
}) => {
  test.setTimeout(210000);
  await instrument(page);
  await page.goto("/metronome");
  await expect(
    page.getByRole("button", { name: "Start metronome", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Tempo (BPM)", { exact: true }).fill("120");
  await page
    .getByRole("button", { name: "Start metronome", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Running");
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const end = performance.now() + 80;
    while (performance.now() < end) {
      /* deliberate short UI stall; audio continues */
    }
  });
  await page.waitForTimeout(179000);
  await page
    .getByRole("button", { name: "Stop metronome", exact: true })
    .click();
  const clicks = await page.evaluate(() => window.__metClicks);
  expect(clicks.length).toBeGreaterThanOrEqual(350);
  expect(clicks.every((c) => c.time >= c.called)).toBe(true);
  let maximum = 0;
  for (let i = 1; i < clicks.length; i++)
    maximum = Math.max(
      maximum,
      Math.abs(clicks[i].time - clicks[0].time - i * 0.5),
    );
  expect(maximum).toBeLessThan(0.001);
  expect(clicks[0].frequency).toBe(1760);
  expect(clicks[1].frequency).toBe(880);
  await expect
    .poll(() => page.evaluate(() => window.__metContexts.at(-1)!.state))
    .toBe("closed");
  console.log(
    `Metronome measurement: ${clicks.length} clicks, maximum audio-schedule phase error ${maximum.toFixed(9)} seconds over three minutes.`,
  );
});
