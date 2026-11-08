import { test, expect } from "@playwright/test";
test("foundation page is served", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Chord House");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
