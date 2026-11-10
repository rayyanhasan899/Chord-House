import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test("administration publishes reviewed content, resolves private reports and stages imports", async ({
  page,
  browser,
}) => {
  test.skip(!process.env.CHORD_E2E_MAIL_DIR, "Requires isolated API/database");
  test.setTimeout(120000);
  const origin = { Origin: "http://127.0.0.1:3100" };
  const email = `manager-${Date.now()}@example.com`,
    password = "Manager browser phrase 123!";
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        headers: origin,
        data: {
          email,
          password,
          display_name: "Catalogue editor",
          acknowledge_privacy: true,
        },
      })
    ).status(),
  ).toBe(201);
  const login = await page.request.post("/api/v1/auth/login", {
    headers: origin,
    data: { email, password },
  });
  const profile = await login.json();
  // Provision only this synthetic account in the disposable test database.
  const code =
    "import os,sys; from sqlalchemy import create_engine,text; e=create_engine(os.environ['CHORD_TEST_DATABASE_URL']); c=e.connect(); c.execute(text(\"UPDATE accounts SET role='content_manager' WHERE id=CAST(:id AS uuid)\"),{'id':sys.argv[1]}); c.commit(); c.close()";
  execFileSync(process.env.CHORD_PYTHON || "python", ["-c", code, profile.id], {
    cwd: resolve("../backend"),
    env: process.env,
  });
  await page.goto("/admin");
  expect((await (await page.request.get("/api/v1/me")).json()).role).toBe(
    "content_manager",
  );
  await expect(
    page.getByRole("heading", { name: "Administration", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Content type", { exact: true })
    .selectOption("instrument");
  await page
    .getByRole("button", { name: "Create instrument", exact: true })
    .click();
  const key = `browser-${Date.now()}`;
  await page.getByLabel("Catalogue code", { exact: true }).fill(key);
  await page
    .getByLabel("Content · Name", { exact: true })
    .fill("Browser test instrument");
  const field = (name: string) =>
    page.getByLabel(`Content · Provenance and rights · ${name}`, {
      exact: true,
    });
  await field("License").fill("Original test reference");
  await field("Source URL (HTTPS)").fill("https://example.com/original-test");
  await field("Attribution").fill("Synthetic browser test");
  await field("Permission evidence").fill(
    "Original synthetic test definition; no third-party content.",
  );
  await field("Terms version").fill("test-v1");
  await field("Reviewer").fill("Synthetic reviewer");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByText("Content saved as draft.", { exact: true }),
  ).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Publish reviewed content", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Check content structure" }),
  ).toBeVisible();
  for (const name of [
    "Rights reviewed",
    "Display permitted",
    "Caching permitted",
  ])
    await field(name).check();
  await page
    .getByRole("button", { name: "Publish reviewed content", exact: true })
    .click();
  await expect(
    page.getByText("Content published.", { exact: true }),
  ).toBeVisible();
  const refs = await (
    await page.request.get("/api/v1/reference-content/instrument")
  ).json();
  expect(refs.some((r: { key: string }) => r.key === key)).toBe(true);
  await page.getByRole("button", { name: "Close editor", exact: true }).click();
  const other = await browser.newContext();
  const player = await other.newPage();
  const userEmail = `reporter-${Date.now()}@example.com`;
  await player.request.post("/api/v1/auth/register", {
    headers: origin,
    data: {
      email: userEmail,
      password,
      display_name: "Reporter",
      acknowledge_privacy: true,
    },
  });
  await player.request.post("/api/v1/auth/login", {
    headers: origin,
    data: { email: userEmail, password },
  });
  await player.goto(`/reports?kind=instrument&key=${key}`);
  await player
    .getByLabel("Problem or suggested correction")
    .fill("Please check this test definition.");
  await player.getByRole("button", { name: "Submit private report" }).click();
  await expect(
    player.getByText("Report submitted privately.", { exact: true }),
  ).toBeVisible();
  await player.goto("/admin");
  await expect(
    player.getByText(/Content manager access required/),
  ).toBeVisible();
  expect(
    (await player.request.get("/api/v1/content-reports?managed=true")).status(),
  ).toBe(403);
  await page
    .getByRole("button", { name: "Refresh reports", exact: true })
    .click();
  const report = page
    .locator("li")
    .filter({ hasText: "Please check this test definition." });
  await expect(report).toBeVisible();
  await expect(page.getByText(userEmail, { exact: true })).toHaveCount(0);
  await report.getByRole("button", { name: "Mark corrected" }).click();
  await expect(
    page.getByText("Report corrected.", { exact: true }),
  ).toBeVisible();
  await player.goto("/reports");
  await expect(player.getByText(/Status: corrected/)).toBeVisible();
  const songs = JSON.parse(
    readFileSync(
      resolve("../backend/app/modules/catalog/data/original-songs.json"),
      "utf8",
    ),
  );
  const song = { ...songs[0], external_key: key, title: key };
  const pack = { key, replace_existing: false, items: [song] };
  await page.getByLabel("Catalogue import file").setInputFiles({
    name: "original-test.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(pack)),
  });
  await page.getByRole("button", { name: "Stage import", exact: true }).click();
  await expect(
    page.getByText("Import staged for review.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Publish reviewed import", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel(
      "I reviewed the complete pack, replacement effects and every component’s permissions.",
    )
    .check();
  await page
    .getByRole("button", { name: "Publish reviewed import", exact: true })
    .click();
  await expect(
    page.getByText("Reviewed import published.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Load audit history", exact: true })
    .click();
  await expect(
    page.getByText("Audit history loaded.", { exact: true }),
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
    path: resolve("../.artifacts/phase15-administration.png"),
    fullPage: true,
  });
  await other.close();
});
