import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
const directory = process.env.CHORD_E2E_MAIL_DIR;
function code(email: string, purpose: string) {
  if (!directory) throw new Error("Private test mail directory required");
  const files = readdirSync(directory)
    .map((name) => resolve(directory, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  for (const file of files) {
    const mail = JSON.parse(readFileSync(file, "utf8"));
    if (mail.recipient.toLowerCase() === email && mail.purpose === purpose)
      return String(mail.token);
  }
  throw new Error("Test account mail not delivered");
}
test("real account registration onboarding verification recovery and signout", async ({
  page,
}) => {
  test.skip(
    !directory,
    "Use the real PostgreSQL/API browser runner for account journeys",
  );
  const email = `learner-${Date.now()}@example.com`;
  const password = "Browser test phrase 123!";
  await page.goto("/account");
  await expect(page).toHaveURL(/login/);
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Display name").fill("Practice Learner");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Account created");
  await page.getByRole("link", { name: "Sign in to your account" }).click();
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("wrong password phrase");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Invalid email or password" }),
  ).toContainText("Invalid email or password");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page
    .getByRole("combobox", { name: "Instrument", exact: true })
    .selectOption("ukulele");
  await page
    .getByRole("combobox", { name: "Skill level" })
    .selectOption("intermediate");
  await page.getByLabel("Timezone", { exact: true }).fill("Asia/Karachi");
  await page
    .getByRole("combobox", { name: "Chord display preference" })
    .selectOption("fretboard");
  await page
    .getByLabel("Learning interests")
    .fill("Urdu and Hindi guitar learning");
  await expect(
    page.getByRole("combobox", { name: "Preferred tuning" }),
  ).toHaveValue("reentrant");
  await page.getByRole("combobox", { name: "Appearance" }).selectOption("dark");
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page).toHaveURL(/account/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Practice Learner",
  );
  await expect(page.getByText("Asia/Karachi", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.reload();
  await expect(page.getByText("Asia/Karachi", { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Verify your email", exact: true })
    .click();
  await page.getByLabel("Verification code").fill(code(email, "verify"));
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Email verified");
  await page.getByRole("link", { name: "My account" }).click();
  await expect(page.getByText("Email verified", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto("/account");
  await expect(page).toHaveURL(/login/);
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(page).toHaveURL(/forgot/);
  await expect(
    page.getByRole("heading", { name: "Forgot your password?" }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByRole("status")).toContainText("If eligible");
  await page.getByRole("link", { name: "I have a reset code" }).click();
  await page.getByLabel("Reset code").fill(code(email, "reset"));
  await page.getByLabel("New password").fill(password + "reset");
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Password reset");
  await page.getByRole("link", { name: "Return to sign in" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password + "reset");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/account/);
  await page.getByText("Change password", { exact: true }).click();
  await page.getByLabel("Current password").fill(password + "reset");
  await page.getByLabel("New password").fill(password + "changed");
  await page
    .getByRole("button", { name: "Change password and sign out" })
    .click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password + "changed");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/account/);
  await page.context().clearCookies();
  await page.getByRole("link", { name: "Edit learning preferences" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page).toHaveURL(/login/);
});
test("public pages are responsive accessible and recover from unavailable API", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  mkdirSync(resolve("../.artifacts"), { recursive: true });
  await page.screenshot({
    path: resolve("../.artifacts/phase06-home.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/register");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.route("**/api/v1/me", (route) => route.abort());
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Connection unavailable" }),
  ).toBeVisible();
  await page.unroute("**/api/v1/me");
  if (directory) {
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page).toHaveURL(/login/);
  }
});
