import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("supplied song collection, playback controls and private favorites", async ({
  page,
}) => {
  test.skip(
    !process.env.CHORD_E2E_MAIL_DIR,
    "Requires isolated API/database runner",
  );
  test.setTimeout(90000);
  await page.goto("/songs");
  await expect(page).toHaveURL(/login/);
  const email = `songs-${Date.now()}@example.com`;
  const password = "Song browser phrase 123!";
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
  const response = await page.request.get("/api/v1/songs?limit=100");
  expect(response.status()).toBe(200);
  const catalogue = await response.json();
  expect(catalogue.total).toBeGreaterThan(0);
  const selected =
    catalogue.items.find(
      (song: { audio_available: boolean }) => song.audio_available,
    ) || catalogue.items[0];
  await page.goto("/songs");
  await expect(
    page.getByRole("heading", { name: "Press play. Find your rhythm." }),
  ).toBeVisible();
  await page.getByLabel("Search songs", { exact: true }).fill(selected.title);
  await page.getByRole("link", { name: selected.title, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: selected.title, exact: true }).first(),
  ).toBeVisible();
  if (selected.audio_available) {
    await expect(
      page.getByRole("button", { name: "Play song", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Repeat off" }).click();
    await expect(
      page.getByRole("button", { name: "Repeat on" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("slider", { name: "Volume" })).toBeVisible();
    const media = page.locator("audio");
    await expect
      .poll(() => media.evaluate((el: HTMLAudioElement) => el.duration))
      .toBeGreaterThan(10);
    await page.getByRole("button", { name: "Play song", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Pause song", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => media.evaluate((el: HTMLAudioElement) => el.currentTime))
      .toBeGreaterThan(0.1);
    await page.getByRole("button", { name: "Pause song", exact: true }).click();
    await expect
      .poll(() => media.evaluate((el: HTMLAudioElement) => el.paused))
      .toBe(true);
    expect(await media.evaluate((el: HTMLAudioElement) => el.loop)).toBe(true);
    // End-of-track seeking is tested with repeat off: native looping may wrap
    // immediately at the endpoint, especially in WebKit.
    await page.getByRole("button", { name: "Repeat on" }).click();
    expect(await media.evaluate((el: HTMLAudioElement) => el.loop)).toBe(false);
    await page.getByRole("slider", { name: "Seek in song" }).focus();
    await page.getByRole("slider", { name: "Seek in song" }).press("End");
    await page.getByRole("button", { name: "Rewind 10 seconds" }).click();
    await expect
      .poll(() =>
        media.evaluate((el: HTMLAudioElement) =>
          Math.abs(el.currentTime - (el.duration - 10)),
        ),
      )
      .toBeLessThan(0.5);
    await page.getByRole("slider", { name: "Volume" }).focus();
    await page.getByRole("slider", { name: "Volume" }).press("Home");
    await expect
      .poll(() => media.evaluate((el: HTMLAudioElement) => el.volume))
      .toBe(0);
  }
  if (selected.local_lyrics_available)
    await expect(page.locator(".local-song-lyrics")).not.toBeEmpty();
  if (selected.local_lyrics_available) {
    expect(await page.locator(".local-song-lyrics").textContent()).toBe(
      "Capo 2\r\n\r\n  C\tG\r\nOriginal practice text\r\n",
    );
    expect(
      await page
        .locator(".local-song-lyrics")
        .evaluate((el) => getComputedStyle(el).whiteSpace),
    ).toBe("pre-wrap");
  }
  await page
    .getByRole("button", { name: "Favorite song", exact: true })
    .click();
  await expect(
    page.getByText("Saved privately.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Saved privately.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove favorite song", exact: true })
    .click();
  await expect(
    page.getByText("Not in your favorites yet.", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});
