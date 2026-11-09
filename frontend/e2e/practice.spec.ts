import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

test("private practice lifecycle routines goals persistence and audio cleanup", async ({
  page,
}) => {
  test.skip(
    !process.env.CHORD_E2E_MAIL_DIR,
    "Requires isolated real API/database",
  );
  test.setTimeout(90000);
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    (
      window as unknown as { practiceContexts: AudioContext[] }
    ).practiceContexts = [];
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        (
          window as unknown as { practiceContexts: AudioContext[] }
        ).practiceContexts.push(this);
      }
    };
  });
  await page.goto("/practice");
  await expect(page).toHaveURL(/login/);
  const email = `practice-${Date.now()}@example.com`,
    password = "Practice browser phrase 123!";
  const headers = { Origin: "http://127.0.0.1:3100" };
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        headers,
        data: {
          email,
          password,
          display_name: "Practice player",
          acknowledge_privacy: true,
        },
      })
    ).status(),
  ).toBe(201);
  const login = await page.request.post("/api/v1/auth/login", {
    headers,
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  const mutationHeaders = {
    ...headers,
    "X-CSRF-Token": (await login.json()).csrf_token,
  };
  await page.goto("/practice");
  await expect(
    page.getByRole("button", { name: "Start practice", exact: true }),
  ).toBeEnabled();
  await page
    .getByLabel("Practice focus", { exact: true })
    .fill("Clean chord changes");
  await page.getByLabel("Session chord symbol", { exact: true }).fill("Am");
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(page.getByLabel("Active practice time")).not.toHaveText(
    "00:00:00",
  );
  const active = await (
    await page.request.get("/api/v1/practice/current")
  ).json();
  await page.reload();
  await expect(page.getByText("Session state:")).toContainText("active");
  expect(
    (await (await page.request.get("/api/v1/practice/current")).json()).id,
  ).toBe(active.id);
  await page.getByLabel("Show guided practice tools").check();
  await page
    .getByRole("button", { name: "Start metronome", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as { practiceContexts: AudioContext[] }
          ).practiceContexts.filter((c) => c.state !== "closed").length,
      ),
    )
    .toBe(1);
  await page
    .getByRole("button", { name: "Pause practice", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as { practiceContexts: AudioContext[] }
          ).practiceContexts.filter((c) => c.state !== "closed").length,
      ),
    )
    .toBe(0);
  await page.reload();
  await expect(page.getByText("Session state:")).toContainText("paused");
  const paused = await page.getByLabel("Active practice time").textContent();
  await page
    .getByRole("button", { name: "Resume practice", exact: true })
    .click();
  await expect(page.getByLabel("Active practice time")).not.toHaveText(paused!);
  await page.getByRole("button", { name: "End practice", exact: true }).click();
  await page
    .getByRole("button", { name: "Save practice session", exact: true })
    .click();
  await expect(page.getByText("Practice session saved once.")).toBeVisible();
  let saved = await (
    await page.request.get("/api/v1/practice/sessions")
  ).json();
  expect(saved).toHaveLength(1);
  // Simulate a retried save after the response was lost; it remains one row.
  expect(
    (
      await page.request.post(`/api/v1/practice/sessions/${saved[0].id}/save`, {
        headers: mutationHeaders,
        data: { version: 1 },
      })
    ).status(),
  ).toBe(200);
  await page.getByRole("button", { name: /Edit saved session/ }).click();
  const editor = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Edit practice session",
      exact: true,
    }),
  });
  await editor
    .getByLabel("Session notes", { exact: true })
    .fill("Practiced carefully");
  await page
    .getByRole("button", { name: "Save session changes", exact: true })
    .click();
  await expect(
    page.getByText("Practiced carefully", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Daily goal minutes", { exact: true }).fill("25");
  await page
    .getByRole("button", { name: "Save daily goal", exact: true })
    .click();
  await expect(
    page.getByText("25 minutes · Active", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Pause daily goal").check();
  await page
    .getByRole("button", { name: "Save daily goal", exact: true })
    .click();
  await expect(
    page.getByText("25 minutes · Paused", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Build new routine", exact: true })
    .click();
  await page
    .getByLabel("Routine name", { exact: true })
    .fill("Evening practice");
  await page.getByLabel("Activity 1 seconds", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Add routine activity", exact: true })
    .click();
  await page.getByLabel("Activity 2 name", { exact: true }).fill("Changes");
  await page.getByLabel("Activity 2 seconds", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Move activity 2 up", exact: true })
    .click();
  await expect(page.getByLabel("Activity 1 name", { exact: true })).toHaveValue(
    "Changes",
  );
  await page
    .getByRole("button", { name: "Save new routine", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Duplicate Evening practice", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Evening practice (copy)", exact: true }),
  ).toBeVisible();
  const routines = await (
    await page.request.get("/api/v1/practice/routines")
  ).json();
  const routine = routines.find(
    (r: { name: string }) => r.name === "Evening practice",
  );
  await page
    .getByLabel("Use routine", { exact: true })
    .selectOption(routine.id);
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Activity 1 of 2: Changes/ }),
  ).toBeVisible();
  await page.goto("/dashboard");
  await page.goto("/practice");
  await expect(page.getByText("Session state:")).toContainText("ended", {
    timeout: 15000,
  });
  expect(
    (await (await page.request.get("/api/v1/practice/current")).json())
      .duration_seconds,
  ).toBe(4);
  await page
    .getByRole("button", { name: "Save practice session", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit Evening practice", exact: true })
    .click();
  await page
    .getByLabel("Routine description", { exact: true })
    .fill("Edited template");
  await page
    .getByRole("button", { name: "Save routine changes", exact: true })
    .click();
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Delete Evening practice", exact: true })
    .click();
  await expect(
    page.getByText("Routine snapshot: Evening practice", { exact: true }),
  ).toBeVisible();
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  mkdirSync(resolve("../.artifacts"), { recursive: true });
  await page.screenshot({
    path: resolve("../.artifacts/phase13-practice.png"),
    fullPage: true,
  });
  saved = await (await page.request.get("/api/v1/practice/sessions")).json();
  expect(saved).toHaveLength(2);
  await page
    .getByRole("button", {
      name: `Delete saved session ${saved[0].id}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: `Delete saved session ${saved[0].id}`,
      exact: true,
    }),
  ).toHaveCount(0);
  // Reuse the published pattern engine inside a persisted routine as well.
  const patterns = await (await page.request.get("/api/v1/patterns")).json();
  const patterned = await page.request.post("/api/v1/practice/routines", {
    headers: mutationHeaders,
    data: {
      client_key: crypto.randomUUID(),
      name: "Guided rhythm",
      instrument: "acoustic_guitar",
      activities: [
        {
          name: "Even strokes",
          duration_seconds: 60,
          tool: "pattern",
          pattern_id: patterns[0].id,
          chord_name: "C",
          bpm: 100,
        },
      ],
    },
  });
  expect(patterned.status()).toBe(201);
  expect(
    (
      await page.request.post("/api/v1/practice/sessions", {
        headers: mutationHeaders,
        data: {
          client_key: crypto.randomUUID(),
          instrument: "acoustic_guitar",
          routine_id: (await patterned.json()).id,
        },
      })
    ).status(),
  ).toBe(201);
  await page.reload();
  await page.getByLabel("Show guided practice tools").check();
  await page
    .getByRole("button", { name: "Play guided pattern", exact: true })
    .click();
  await expect(
    page.getByText("Pattern and metronome playing on one audio clock."),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as { practiceContexts: AudioContext[] }
          ).practiceContexts.filter((c) => c.state !== "closed").length,
      ),
    )
    .toBe(1);
  await page
    .getByRole("button", { name: "Pause practice", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as { practiceContexts: AudioContext[] }
          ).practiceContexts.filter((c) => c.state !== "closed").length,
      ),
    )
    .toBe(0);
  await page
    .getByRole("button", { name: "Discard unsaved session", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start practice", exact: true }),
  ).toBeEnabled();
});
