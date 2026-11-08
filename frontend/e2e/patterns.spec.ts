import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { library, pitches } from "../src/features/chords/music";
declare global {
  interface Window {
    __patternContexts: AudioContext[];
    __patternStarts: { time: number; frequency: number }[];
  }
}
test("pattern library private CRUD favorites and synchronized playback", async ({
  page,
}) => {
  test.skip(
    !process.env.CHORD_E2E_MAIL_DIR,
    "Requires real API/database runner",
  );
  test.setTimeout(60000);
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    window.__patternContexts = [];
    window.__patternStarts = [];
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.__patternContexts.push(this);
        const create = this.createOscillator.bind(this);
        this.createOscillator = () => {
          const osc = create();
          const start = osc.start.bind(osc);
          osc.start = (time = 0) => {
            window.__patternStarts.push({
              time,
              frequency: osc.frequency.value,
            });
            start(time);
          };
          return osc;
        };
      }
    };
  });
  await page.goto("/patterns");
  await expect(page).toHaveURL(/login/);
  const email = `rhythm-${Date.now()}@example.com`,
    password = "Pattern browser phrase 123!";
  const headers = { Origin: "http://127.0.0.1:3100" };
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        headers,
        data: {
          email,
          password,
          display_name: "Rhythm player",
          acknowledge_privacy: true,
        },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await page.request.post("/api/v1/auth/login", {
        headers,
        data: { email, password },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/patterns");
  await expect(
    page.getByRole("heading", { name: "Quarter-note foundation", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Filter meter", exact: true })
    .selectOption("3/4");
  await expect(
    page.getByRole("button", { name: "Open Waltz foundation", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Open Quarter-note foundation",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Filter meter", exact: true })
    .selectOption("");
  await page
    .getByLabel("Search patterns", { exact: true })
    .fill("does not exist");
  await expect(
    page.getByText("No patterns match.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Search patterns", { exact: true }).fill("");
  await page
    .getByRole("button", { name: "Open Quarter-note foundation", exact: true })
    .click();
  await page.getByLabel("Pattern name", { exact: true }).fill("My rhythm");
  await page
    .getByRole("button", { name: "Save private pattern", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Private pattern saved.",
  );
  await page
    .getByRole("button", { name: "Favorite My rhythm", exact: true })
    .click();
  await page.getByLabel("Favorites only").check();
  await expect(
    page.getByRole("button", { name: "Open My rhythm", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Unfavorite My rhythm", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open My rhythm", exact: true })
    .click();
  await page.getByLabel("Pattern name", { exact: true }).fill("Edited rhythm");
  await page
    .getByRole("button", { name: "Save private changes", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Private pattern saved.",
  );
  await page.getByLabel("Playback BPM", { exact: true }).fill("301");
  await expect(
    page.getByRole("button", { name: "Play pattern", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Playback BPM", { exact: true }).fill("240");
  await page.getByLabel("Include synchronized metronome").check();
  await page.getByRole("button", { name: "Play pattern", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Playing pattern.");
  await expect
    .poll(() => page.evaluate(() => window.__patternStarts.length))
    .toBeGreaterThan(12);
  expect(
    await page.evaluate(
      () => window.__patternContexts.filter((c) => c.state !== "closed").length,
    ),
  ).toBe(1);
  await expect(page.locator('.stroke-grid [aria-current="step"]')).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Stop pattern", exact: true }).click();
  const starts = await page.evaluate(() => window.__patternStarts);
  const clickTimes = starts
    .filter((s) => s.frequency === 1760 || s.frequency === 880)
    .map((s) => s.time);
  expect(clickTimes.length).toBeGreaterThanOrEqual(2);
  expect(Math.abs(clickTimes[1] - clickTimes[0] - 0.25)).toBeLessThan(1e-6);
  await expect
    .poll(() => page.evaluate(() => window.__patternContexts.at(-1)!.state))
    .toBe("closed");
  await page
    .getByRole("combobox", { name: "Pattern meter", exact: true })
    .selectOption("2/4");
  await page
    .getByRole("combobox", { name: "Steps per beat", exact: true })
    .selectOption("2");
  for (const [i, stroke] of ["D", "R", "U", "X"].entries()) {
    await page
      .getByRole("combobox", { name: new RegExp(`^Stroke ${i + 1},`) })
      .selectOption(stroke);
  }
  await page.getByLabel("Include synchronized metronome").uncheck();
  await page.getByLabel("Loop pattern").uncheck();
  await page.getByLabel("Playback BPM", { exact: true }).fill("120");
  await page.evaluate(() => {
    window.__patternStarts = [];
  });
  await page.getByRole("button", { name: "Play pattern", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Measure finished", {
    timeout: 5000,
  });
  const directional = await page.evaluate(() => window.__patternStarts);
  const notes = pitches(
    "guitar",
    library.find((c) => c.instrument === "guitar")!.frets,
  );
  expect(directional.length).toBe(notes.length * 2 + 1);
  expect(directional[0].frequency).toBeCloseTo(
    440 * 2 ** ((notes[0] - 69) / 12),
  );
  expect(directional[notes.length].frequency).toBeCloseTo(
    440 * 2 ** ((notes.at(-1)! - 69) / 12),
  );
  expect(directional.at(-1)!.frequency).toBe(130);
  expect(
    directional.every(
      (s) => Math.abs(s.time - directional[0].time - 0.25) > 0.05,
    ),
  ).toBe(true);
  await page.getByLabel("Loop pattern").check();
  await page.getByLabel("Loop pattern").uncheck();
  await page.getByRole("button", { name: "Play pattern", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Measure finished", {
    timeout: 5000,
  });
  await expect
    .poll(() => page.evaluate(() => window.__patternContexts.at(-1)!.state))
    .toBe("closed");
  await page.getByLabel("Loop pattern").check();
  await page.getByRole("button", { name: "Play pattern", exact: true }).click();
  await page.evaluate(() => window.__patternContexts.at(-1)!.suspend());
  await expect(page.getByRole("status")).toContainText("Audio paused");
  await expect
    .poll(() => page.evaluate(() => window.__patternContexts.at(-1)!.state))
    .toBe("closed");
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
    path: resolve("../.artifacts/phase11-patterns.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Play pattern", exact: true }).click();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__patternContexts.at(-1)!.state))
    .toBe("closed");
  await page.goto("/patterns");
  await page
    .getByRole("button", { name: "Open Edited rhythm", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete private pattern", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Private pattern deleted.",
  );
  await expect(
    page.getByRole("button", { name: "Open Edited rhythm", exact: true }),
  ).toHaveCount(0);
});
