import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

test("three-language discovery learning and private song collections", async ({
  page,
}) => {
  test.skip(
    !process.env.CHORD_E2E_MAIL_DIR,
    "Requires real API/database runner",
  );
  test.setTimeout(90000);
  await page.goto("/songs");
  await expect(page).toHaveURL(/login/);
  const email = `song-${Date.now()}@example.com`,
    password = "Song browser phrase 123!";
  const headers = { Origin: "http://127.0.0.1:3100" };
  expect(
    (
      await page.request.post("/api/v1/auth/register", {
        headers,
        data: {
          email,
          password,
          display_name: "Song player",
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
  await page.goto("/songs");
  await expect(
    page.getByRole("link", { name: "Aadat", exact: true }),
  ).toBeVisible();
  const first = await page.locator(".pattern-library h2 a").allTextContents();
  await page.getByRole("button", { name: "Next songs", exact: true }).click();
  await expect(
    page.getByText("Showing 21–40.", { exact: false }),
  ).toBeVisible();
  const second = await page.locator(".pattern-library h2 a").allTextContents();
  expect(second.some((s) => first.includes(s))).toBe(false);
  await page
    .getByLabel("Search songs", { exact: true })
    .fill("not a real catalogue title");
  await expect(
    page.getByText("No songs match.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Search songs", { exact: true }).fill("Aadat");
  await page.getByRole("link", { name: "Aadat", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Aadat", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No approved arrangement is available.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Full lyrics are unavailable", { exact: false }),
  ).toBeVisible();
  await page.goto("/songs");
  await page.getByLabel("Search songs", { exact: true }).fill("عادت");
  await expect(
    page.getByRole("link", { name: "Aadat", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Song language", exact: true })
    .selectOption("hi");
  await page.getByLabel("Search songs", { exact: true }).fill("Tum Hi Ho");
  await expect(
    page.getByRole("link", { name: "Tum Hi Ho", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search songs", { exact: true }).fill("तुम ही हो");
  await expect(
    page.getByRole("link", { name: "Tum Hi Ho", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Song language", exact: true })
    .selectOption("");
  await page
    .getByLabel("Search songs", { exact: true })
    .fill("One More Morning");
  await page
    .getByRole("link", { name: "One More Morning", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "One More Morning", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "C guitar chord diagram", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("The window holds a square of light", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Transpose semitones", exact: true })
    .selectOption("1");
  await page
    .getByRole("combobox", { name: "Accidental preference", exact: true })
    .selectOption("flat");
  await expect(
    page.getByRole("img", { name: "Db guitar chord diagram", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("For this higher key", { exact: false }),
  ).toContainText("capo 1");
  await page
    .getByRole("button", { name: "Reset original key", exact: true })
    .click();
  await expect(
    page.getByText("Transpose offset: 0 semitones.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Choose arrangement", exact: true })
    .selectOption("2");
  await expect(
    page.getByRole("img", { name: "C ukulele chord diagram", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No reliable capo calculation", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Choose arrangement", exact: true })
    .selectOption("0");
  await page
    .getByLabel("New collection name", { exact: true })
    .fill("Songs to learn");
  await page
    .getByRole("button", { name: "Create song collection", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Collection created");
  await page
    .getByRole("combobox", { name: "Learning status", exact: true })
    .selectOption("comfortable");
  await page
    .getByRole("button", { name: "Favorite song", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Song saved");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Update saved song", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Learning status", exact: true }),
  ).toHaveValue("comfortable");
  await page.getByRole("link", { name: "Workspace", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Filter", exact: true })
    .selectOption("favorite");
  await page
    .getByRole("combobox", { name: "Filter saved collection", exact: true })
    .selectOption({ label: "Songs to learn" });
  await page
    .getByRole("combobox", { name: "Filter song learning status", exact: true })
    .selectOption("comfortable");
  await page
    .getByRole("combobox", { name: "Sort saved items", exact: true })
    .selectOption("title");
  await expect(
    page.getByRole("heading", { name: "One More Morning", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Open linked song", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Update saved song", exact: true }),
  ).toBeVisible();
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
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  mkdirSync(resolve("../.artifacts"), { recursive: true });
  await page.screenshot({
    path: resolve("../.artifacts/phase12-song-learning.png"),
    fullPage: true,
  });
  await page.getByLabel("Simplified practice view").check();
  await expect(
    page.getByRole("heading", { name: "Your saved song", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Learning text size").focus();
  await page.getByLabel("Learning text size").press("End");
  await expect(page.getByLabel("Learning text size")).toHaveValue("32");
  await page.getByLabel("Simplified practice view").uncheck();
  await page
    .getByRole("button", { name: "Remove favorite song", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Song removed");
  await page.goto("/songs");
  await page.getByLabel("Search songs", { exact: true }).fill("Aik Nayi Subah");
  await page.getByRole("link", { name: "Aik Nayi Subah", exact: true }).click();
  await expect(
    page.getByText("Khidki se roshni aayi", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Text variant", exact: true })
    .selectOption("1");
  await expect(page.locator('.song-lines[dir="rtl"]')).toBeVisible();
  await expect(
    page.getByText("کھڑکی سے روشنی آئی", { exact: true }),
  ).toBeVisible();
  await page.goto("/songs");
  await page.getByLabel("Search songs", { exact: true }).fill("Nayi Dhoop");
  await page.getByRole("link", { name: "Nayi Dhoop", exact: true }).click();
  await expect(
    page.getByText("Aangan mein nayi dhoop aayi", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Text variant", exact: true })
    .selectOption("1");
  await expect(
    page.getByText("आँगन में नई धूप आई", { exact: true }),
  ).toBeVisible();
  await page.goto("/songs/00000000-0000-0000-0000-000000000000");
  await expect(
    page.getByRole("heading", { name: "Song unavailable", exact: true }),
  ).toBeVisible();
  await page.route("**/api/v1/songs?**", (route) => route.abort());
  await page.goto("/songs");
  await expect(
    page.getByRole("button", { name: "Retry songs", exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/v1/songs?**");
  await page.getByRole("button", { name: "Retry songs", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Aadat", exact: true }),
  ).toBeVisible();
});
