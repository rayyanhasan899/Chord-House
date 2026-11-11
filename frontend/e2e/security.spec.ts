import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const origin = { Origin: "http://127.0.0.1:3100" };
const password = "Private browser security phrase 123!";
async function account(page: import("@playwright/test").Page, verified = true) {
  const email = `privacy-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        headers: origin,
        data: {
          email,
          password,
          display_name: "Private player",
          acknowledge_privacy: true,
        },
      })
    ).status(),
  ).toBe(201);
  if (verified) {
    const mailDir = process.env.CHORD_E2E_MAIL_DIR!;
    const code = readdirSync(mailDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(mailDir, f), "utf8")))
      .find((m) => m.recipient === email && m.purpose === "verify");
    expect(code).toBeTruthy();
    expect(
      (
        await page.request.post("/api/v1/auth/verify/confirm", {
          headers: origin,
          data: { token: code.token },
        })
      ).status(),
    ).toBe(200);
  }
  const login = await page.request.post("/api/v1/auth/login", {
    headers: origin,
    data: { email, password },
  });
  expect(login.status()).toBe(200);
  return {
    email,
    headers: { ...origin, "X-CSRF-Token": (await login.json()).csrf_token },
  };
}

test("private export and confirmed account deletion are usable and isolated", async ({
  page,
}) => {
  test.skip(!process.env.CHORD_E2E_MAIL_DIR, "Requires isolated API/database");
  test.setTimeout(90000);
  const owner = await account(page);
  const other = await page
    .context()
    .browser()!
    .newContext({ baseURL: "http://127.0.0.1:3100" });
  const otherPage = await other.newPage();
  try {
    const second = await account(otherPage);
    expect(
      (
        await page.request.post("/api/v1/workspace", {
          headers: owner.headers,
          data: {
            kind: "note",
            title: "My private exercise",
            body: "Roman Urdu: meri mashq",
          },
        })
      ).status(),
    ).toBe(201);
    expect(
      (
        await otherPage.request.post("/api/v1/workspace", {
          headers: second.headers,
          data: {
            kind: "note",
            title: "Other private exercise",
            body: "Other user secret",
          },
        })
      ).status(),
    ).toBe(201);
    await page.goto("/account");
    await expect(
      page.getByRole("heading", { name: "Your data and account", exact: true }),
    ).toBeVisible();
    await page.getByText("Download my personal data", { exact: true }).click();
    await page.getByText("Delete account", { exact: true }).click();
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
    await page
      .getByLabel("Current password for export", { exact: true })
      .fill("wrong password");
    await page
      .getByLabel("I understand this file contains my private data", {
        exact: true,
      })
      .check();
    await page
      .getByRole("button", { name: "Download personal data", exact: true })
      .click();
    await expect(
      page.getByRole("alert").filter({ hasText: "current password" }),
    ).toBeVisible();
    await page
      .getByLabel("Current password for export", { exact: true })
      .fill(password);
    await page
      .getByLabel("I understand this file contains my private data", {
        exact: true,
      })
      .check();
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download personal data", exact: true })
      .click();
    const file = await downloaded;
    expect(file.suggestedFilename()).toBe("chord-house-personal-data.json");
    const document = JSON.parse(readFileSync((await file.path())!, "utf8"));
    expect(document.format).toBe("chord-house.personal-data.v1");
    expect(document.profile.email).toBe(owner.email);
    expect(JSON.stringify(document)).toContain("meri mashq");
    expect(JSON.stringify(document)).not.toContain("Other user secret");
    expect(document.profile.password_hash).toBeUndefined();
    await expect(
      page.getByRole("status").filter({ hasText: "download started" }),
    ).toBeVisible();
    await page
      .getByLabel("Current password for deletion", { exact: true })
      .fill(password);
    await page
      .getByLabel("Type DELETE to confirm", { exact: true })
      .fill("KEEP");
    await page
      .getByLabel(
        "I understand my account and private records will be permanently deleted",
        { exact: true },
      )
      .check();
    await page
      .getByRole("button", {
        name: "Permanently delete my account",
        exact: true,
      })
      .click();
    expect((await page.request.get("/api/v1/me")).status()).toBe(200);
    await expect(
      page.getByLabel("Type DELETE to confirm", { exact: true }),
    ).toBeFocused();
    await page
      .getByLabel("Type DELETE to confirm", { exact: true })
      .fill("DELETE");
    mkdirSync(resolve("../.artifacts"), { recursive: true });
    await page.screenshot({
      path: resolve("../.artifacts/phase17-privacy.png"),
      fullPage: true,
    });
    await page
      .getByRole("button", {
        name: "Permanently delete my account",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/login\?deleted=1/);
    await expect(page.getByRole("status")).toContainText(
      "All sessions have been revoked",
    );
    expect((await page.request.get("/api/v1/me")).status()).toBe(401);
    expect((await otherPage.request.get("/api/v1/me")).status()).toBe(200);
    const remaining = await (
      await otherPage.request.get("/api/v1/workspace")
    ).json();
    expect(JSON.stringify(remaining)).toContain("Other user secret");
    expect(JSON.stringify(remaining)).not.toContain("meri mashq");
    expect(
      (
        await page.request.post("/api/v1/auth/login", {
          headers: origin,
          data: { email: owner.email, password },
        })
      ).status(),
    ).toBe(401);
  } finally {
    await other.close();
  }
});

test("keyboard text alternatives, reduced motion, permissions and response hardening", async ({
  page,
}) => {
  test.skip(!process.env.CHORD_E2E_MAIL_DIR, "Requires isolated API/database");
  test.setTimeout(90000);
  await account(page, false);
  const offsite = new Set<string>();
  page.on("request", (request) => {
    if (
      !request.url().startsWith("http://127.0.0.1:3100") &&
      !request.url().startsWith("blob:") &&
      !request.url().startsWith("data:")
    )
      offsite.add(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/account");
  expect(response!.headers()["x-frame-options"]).toBe("DENY");
  expect(response!.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response!.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  await expect(
    page.getByRole("heading", { name: /Welcome home/ }),
  ).toBeVisible();
  await page.getByText("Delete account", { exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Permanently delete my account",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByText("Verify your email before deletion.", { exact: false }),
  ).toBeVisible();
  for (const route of [
    "/tuner",
    "/chords",
    "/metronome",
    "/patterns",
    "/songs",
    "/practice",
    "/progress",
    "/training",
    "/reports",
    "/privacy",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await page
      .getByRole("link", { name: "Skip to content", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    const heading = await page.locator("h1").innerText();
    expect(heading.length).toBeGreaterThan(2);
    expect(await page.locator("#main").ariaSnapshot()).toContain(heading);
  }
  await page.goto("/tuner");
  await expect(
    page.getByText("Microphone audio stays in your browser.", { exact: false }),
  ).toBeVisible();
  // No microphone action or permission request has occurred during page reads.
  expect(offsite.size).toBe(0);
});
