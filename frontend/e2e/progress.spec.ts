import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

test("progress recomputes session corrections/deletion and keeps roadmap/reviews private", async ({
  page,
  browser,
}) => {
  test.skip(!process.env.CHORD_E2E_MAIL_DIR, "Requires isolated API/database");
  test.setTimeout(90000);
  const origin = { Origin: "http://127.0.0.1:3100" };
  const email = `progress-${Date.now()}@example.com`,
    password = "Progress browser phrase 123!";
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        headers: origin,
        data: {
          email,
          password,
          display_name: "Progress player",
          acknowledge_privacy: true,
        },
      })
    ).status(),
  ).toBe(201);
  const login = await page.request.post("/api/v1/auth/login", {
    headers: origin,
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  const headers = {
    ...origin,
    "X-CSRF-Token": (await login.json()).csrf_token,
  };
  // Keep the test's saved intervals away from local midnight at any UTC hour.
  const timezone = new Date().getUTCHours() < 12 ? "Etc/GMT-12" : "UTC";
  expect(
    (
      await page.request.patch("/api/v1/me", {
        headers,
        data: {
          display_name: "Progress player",
          instrument: "acoustic_guitar",
          skill: "beginner",
          timezone,
        },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/progress");
  await expect(page.getByTestId("total-practice-minutes")).toHaveText(
    "0 minutes",
  );
  const started = await page.request.post("/api/v1/practice/sessions", {
    headers,
    data: {
      client_key: crypto.randomUUID(),
      instrument: "acoustic_guitar",
      focus: "Clean changes",
    },
  });
  expect(started.status()).toBe(201);
  const session = await started.json();
  let result = await page.request.post(
    `/api/v1/practice/sessions/${session.id}/end`,
    { headers, data: { version: session.version } },
  );
  result = await page.request.put(`/api/v1/practice/sessions/${session.id}`, {
    headers,
    data: {
      instrument: "acoustic_guitar",
      focus: "Clean changes",
      version: (await result.json()).version,
      corrected_start: new Date(Date.now() - 600000).toISOString(),
      corrected_seconds: 120,
    },
  });
  expect(result.status()).toBe(200);
  expect(
    (
      await page.request.post(`/api/v1/practice/sessions/${session.id}/save`, {
        headers,
        data: { version: (await result.json()).version },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.put("/api/v1/practice/goals/daily", {
        headers,
        data: { minutes: 2 },
      })
    ).status(),
  ).toBe(200);
  await page
    .getByRole("button", { name: "Refresh progress", exact: true })
    .click();
  await expect(page.getByTestId("total-practice-minutes")).toHaveText(
    "2 minutes",
  );
  await expect(
    page.getByRole("progressbar", { name: "daily goal progress" }),
  ).toHaveAttribute("value", "100");
  await page.goto("/practice");
  await page
    .getByRole("button", {
      name: `Edit saved session ${session.id}`,
      exact: true,
    })
    .click();
  await page.getByLabel("Correct session time", { exact: true }).check();
  await page.getByLabel("Corrected active seconds", { exact: true }).fill("60");
  await page
    .getByRole("button", { name: "Save session changes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Edit practice session", exact: true }),
  ).toHaveCount(0);
  await page.goto("/progress");
  await expect(page.getByTestId("total-practice-minutes")).toHaveText(
    "1 minutes",
  );
  await expect(
    page.getByRole("progressbar", { name: "daily goal progress" }),
  ).toHaveAttribute("value", "50");
  const tuning = page.getByRole("checkbox", {
    name: "Complete Tune and listen",
    exact: true,
  });
  await tuning.check();
  await expect(
    page.getByText("Milestone updated. Completion is self-reported."),
  ).toBeVisible();
  await page.reload();
  await expect(tuning).toBeChecked();
  await page
    .getByLabel("What would you like to improve?", { exact: true })
    .fill("Relax my fretting hand");
  await page
    .getByRole("button", { name: "Save weekly reflection", exact: true })
    .click();
  await expect(page.getByText("Weekly reflection saved.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("What would you like to improve?", { exact: true }),
  ).toHaveValue("Relax my fretting hand");
  const other = await browser.newContext();
  const otherEmail = `other-${Date.now()}@example.com`;
  expect(
    (
      await other.request.post("http://127.0.0.1:3100/api/v1/auth/register", {
        headers: origin,
        data: {
          email: otherEmail,
          password,
          display_name: "Other",
          acknowledge_privacy: true,
        },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await other.request.post("http://127.0.0.1:3100/api/v1/auth/login", {
        headers: origin,
        data: { email: otherEmail, password },
      })
    ).status(),
  ).toBe(200);
  const privateSummary = await (
    await other.request.get("http://127.0.0.1:3100/api/v1/practice/progress")
  ).json();
  expect(privateSummary.total_seconds).toBe(0);
  expect(privateSummary.review.improvement).toBe("");
  const privateMap = await (
    await other.request.get("http://127.0.0.1:3100/api/v1/practice/roadmap")
  ).json();
  expect(
    privateMap.milestones.every(
      (m: { completed_at: string | null }) => m.completed_at === null,
    ),
  ).toBe(true);
  await other.close();
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
    path: resolve("../.artifacts/phase14-progress.png"),
    fullPage: true,
  });
  await page.goto("/dashboard");
  await expect(page.getByTestId("total-practice-minutes")).toHaveText(
    "1 minutes",
  );
  await page.goto("/practice");
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: `Delete saved session ${session.id}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: `Delete saved session ${session.id}`,
      exact: true,
    }),
  ).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(page.getByTestId("total-practice-minutes")).toHaveText(
    "0 minutes",
  );
});
