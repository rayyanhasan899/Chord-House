import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
declare global {
  interface Window {
    __trainingContexts: AudioContext[];
    __trainingPitches: number[];
    __notificationRequests: number;
  }
}
async function signIn(page: Page) {
  const origin = { Origin: "http://127.0.0.1:3100" };
  const email = `learn-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password = "Learning browser phrase 123!";
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        headers: origin,
        data: {
          email,
          password,
          display_name: "Learning player",
          acknowledge_privacy: true,
        },
      })
    ).status(),
  ).toBe(201);
  const r = await page.request.post("/api/v1/auth/login", {
    headers: origin,
    data: { email, password },
  });
  expect(r.status()).toBe(200);
  return { ...origin, "X-CSRF-Token": (await r.json()).csrf_token };
}
test("learning journey connects local training, approved sections, saved practice and routines", async ({
  page,
}) => {
  test.skip(!process.env.CHORD_E2E_MAIL_DIR, "Requires isolated API/database");
  test.setTimeout(120000);
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    window.__trainingContexts = [];
    window.__trainingPitches = [];
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.__trainingContexts.push(this);
        const create = this.createOscillator.bind(this);
        this.createOscillator = () => {
          const osc = create();
          const start = osc.start.bind(osc);
          osc.start = (at = 0) => {
            window.__trainingPitches.push(osc.frequency.value);
            start(at);
          };
          return osc;
        };
      }
    };
  });
  await page.goto("/training");
  await expect(page).toHaveURL(/login/);
  const headers = await signIn(page);
  await page.goto("/training");
  await expect(
    page.getByRole("heading", { name: "Current chord: C", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Seconds per change", { exact: true }).fill("0.5");
  await page
    .getByLabel("Play synthesized guide chords", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Start transitions", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__trainingContexts.filter((c) => c.state !== "closed").length,
      ),
    )
    .toBe(1);
  await expect(
    page.getByRole("heading", { name: "Current chord: G", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^Elapsed: [1-9]/)).toBeVisible();
  await page
    .getByRole("button", { name: "Stop training", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__trainingContexts.filter((c) => c.state !== "closed").length,
      ),
    )
    .toBe(0);
  await page
    .getByLabel("Clean changes (self-reported)", { exact: true })
    .fill("3");
  await page
    .getByLabel("Training notes", { exact: true })
    .fill("Relaxed fretting hand");
  await page
    .getByRole("button", { name: "Save self-assessment", exact: true })
    .click();
  await expect(
    page.getByText(
      "Private self-assessment saved. It does not add practice minutes.",
    ),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/v1/practice/progress")).json())
      .total_seconds,
  ).toBe(0);
  await page.getByRole("button", { name: "Ear training", exact: true }).click();
  await page
    .getByRole("button", { name: "New ear question", exact: true })
    .click();
  await page.evaluate(() => {
    window.__trainingPitches = [];
  });
  await page
    .getByRole("button", { name: "Play reference C4", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__trainingPitches.some((f) => Math.abs(f - 261.625565) < 0.01),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Play question", exact: true })
    .click();
  await page.getByRole("button", { name: "Unison", exact: true }).click();
  await expect(page.getByText(/semitones from the first tone/)).toBeVisible();
  await expect(page.getByText(/out of 1 attempts on this page/)).toBeVisible();
  await page.getByRole("button", { name: "Note finder", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__trainingContexts.filter((c) => c.state !== "closed").length,
      ),
    )
    .toBe(0);
  await page
    .getByLabel("Finder instrument", { exact: true })
    .selectOption("ukulele");
  await page.getByLabel("Fret", { exact: true }).fill("2");
  await expect(page.getByText(/Note:/)).toContainText("A4");
  await page
    .getByRole("button", { name: "Play found note", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__trainingPitches.some((f) => Math.abs(f - 440) < 0.01),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Section practice", exact: true })
    .click();
  const songs = await (
    await page.request.get("/api/v1/songs?q=One%20More%20Morning")
  ).json();
  const original = songs.items.find(
    (s: { title: string }) => s.title === "One More Morning",
  );
  expect(original).toBeTruthy();
  await page
    .getByLabel("Practice song", { exact: true })
    .selectOption(original.id);
  await page.getByLabel("First passage line", { exact: true }).fill("1");
  await page.getByLabel("Last passage line", { exact: true }).fill("2");
  await page.getByLabel("Passage cue BPM", { exact: true }).fill("120");
  await page.getByLabel("Beats per line", { exact: true }).fill("1");
  await page
    .getByLabel("Play a generated cue at each line start", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Start passage cues", exact: true })
    .click();
  await expect(page.locator('li[aria-current="step"]')).toHaveCount(1);
  await page
    .getByRole("link", {
      name: "Start a linked saved practice session",
      exact: true,
    })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__trainingContexts.filter((c) => c.state !== "closed").length,
      ),
    )
    .toBe(0);
  await expect(page.getByLabel("Practice focus", { exact: true })).toHaveValue(
    "Passage practice: One More Morning",
  );
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(
    page.getByLabel("Active practice time", { exact: true }),
  ).not.toHaveText("00:00:00");
  await page
    .getByRole("link", {
      name: "Use training tools while this timer runs",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your learning tools.", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Practice sessions", exact: true })
    .click();
  await page.getByRole("button", { name: "End practice", exact: true }).click();
  await page
    .getByRole("button", { name: "Save practice session", exact: true })
    .click();
  await expect(page.getByText("Practice session saved once.")).toBeVisible();
  const progress = await (
    await page.request.get("/api/v1/practice/progress")
  ).json();
  expect(progress.saved_sessions).toBe(1);
  expect(progress.total_seconds).toBeGreaterThan(0);
  await page.goto("/training");
  await page
    .getByRole("button", { name: "Routine suggestion", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save suggested routine", exact: true })
    .click();
  await expect(
    page.getByText("Routine saved privately.", { exact: false }),
  ).toBeVisible();
  const routines = await (
    await page.request.get("/api/v1/practice/routines")
  ).json();
  expect(routines).toHaveLength(1);
  expect(routines[0].activities.at(-1).song_id).toBe(original.id);
  await page
    .getByRole("button", { name: "Chord challenge", exact: true })
    .click();
  await page.getByLabel("Challenge seconds", { exact: true }).fill("5");
  await page
    .getByRole("button", { name: "Start challenge", exact: true })
    .click();
  await expect(
    page.getByText(
      "Round complete. Enter your own clean-change count and assessment.",
    ),
  ).toBeVisible({ timeout: 10000 });
  await page
    .getByLabel("Clean changes (self-reported)", { exact: true })
    .fill("2");
  await page.getByLabel("I completed this exercise", { exact: true }).check();
  await page
    .getByRole("button", { name: "Save self-assessment", exact: true })
    .click();
  await expect(
    page.getByText(
      "Private self-assessment saved. It does not add practice minutes.",
    ),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/v1/practice/progress")).json())
      .saved_sessions,
  ).toBe(1);
  const assessments = await (
    await page.request.get("/api/v1/integration/assessments")
  ).json();
  expect(assessments).toHaveLength(2);
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: `Delete training assessment ${assessments[0].id}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: `Delete training assessment ${assessments[0].id}`,
      exact: true,
    }),
  ).toHaveCount(0);
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.getByRole("button", { name: "Transitions", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Chord challenge", exact: true }),
  ).toBeFocused();
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  mkdirSync(resolve("../.artifacts"), { recursive: true });
  await page.screenshot({
    path: resolve("../.artifacts/phase16-training.png"),
    fullPage: true,
  });
  // A retry of a deleted record cannot resurrect its private payload.
  expect(
    (
      await page.request.post("/api/v1/integration/assessments", {
        headers,
        data: Object.fromEntries(
          Object.entries(assessments[0]).filter(
            ([k]) => !["id", "created_at"].includes(k),
          ),
        ),
      })
    ).status(),
  ).toBe(410);
});
for (const support of ["denied", "unsupported"] as const) {
  test(`reminders remain usable when browser notifications are ${support}`, async ({
    page,
  }) => {
    test.skip(
      !process.env.CHORD_E2E_MAIL_DIR,
      "Requires isolated API/database",
    );
    test.setTimeout(60000);
    await page.addInitScript((mode) => {
      window.__notificationRequests = 0;
      if (mode === "unsupported") {
        Reflect.deleteProperty(window, "Notification");
        return;
      }
      class DeniedNotification {
        static permission: NotificationPermission = "default";
        static async requestPermission() {
          window.__notificationRequests++;
          DeniedNotification.permission = "denied";
          return "denied" as NotificationPermission;
        }
      }
      window.Notification =
        DeniedNotification as unknown as typeof Notification;
    }, support);
    const headers = await signIn(page);
    const now = new Date(
      (await (await page.request.get("/api/v1/practice/progress")).json())
        .as_of,
    );
    const offset = 12 - now.getUTCHours();
    const timezone =
      offset === 0
        ? "UTC"
        : `Etc/GMT${offset > 0 ? "-" : "+"}${Math.abs(offset)}`;
    expect(
      (
        await page.request.patch("/api/v1/me", {
          headers,
          data: {
            display_name: "Reminder player",
            instrument: "acoustic_guitar",
            skill: "beginner",
            timezone,
          },
        })
      ).status(),
    ).toBe(200);
    await page.goto("/training");
    await page.getByRole("button", { name: "Reminders", exact: true }).click();
    await expect(
      page.getByText(/Press the permission button only if/),
    ).toBeVisible();
    expect(await page.evaluate(() => window.__notificationRequests)).toBe(0);
    await page
      .getByRole("button", {
        name: "Enable browser notifications",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        support === "denied"
          ? "Browser notifications were not allowed. In-app reminders still work."
          : "Browser notifications are unsupported. In-app reminders still work.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(await page.evaluate(() => window.__notificationRequests)).toBe(
      support === "denied" ? 1 : 0,
    );
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(now);
    await page.getByLabel("Local reminder time", { exact: true }).fill(time);
    await page.getByLabel("Enable practice reminders", { exact: true }).check();
    await page
      .getByRole("button", { name: "Save reminder settings", exact: true })
      .click();
    await expect(
      page.getByRole("complementary", {
        name: "Practice reminder",
        exact: true,
      }),
    ).toBeVisible({ timeout: 15000 });
    expect(
      (
        await page.request.post("/api/v1/integration/reminder/check", {
          headers,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await (
          await page.request.post("/api/v1/integration/reminder/check", {
            headers,
          })
        ).json()
      ).due,
    ).toBe(false);
    await page
      .getByRole("button", { name: "Dismiss reminder", exact: true })
      .click();
    await page
      .getByLabel("Enable practice reminders", { exact: true })
      .uncheck();
    await page
      .getByRole("button", { name: "Save reminder settings", exact: true })
      .click();
    await expect(
      page.getByText("Practice reminder disabled.", { exact: true }),
    ).toBeVisible();
    expect(
      (await (await page.request.get("/api/v1/integration/reminder")).json())
        .enabled,
    ).toBe(false);
    await page
      .getByRole("button", { name: "Ear training", exact: true })
      .click();
    await page
      .getByRole("button", { name: "New ear question", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Play question", exact: true }),
    ).toBeEnabled();
  });
}
