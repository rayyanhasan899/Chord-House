import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 2,
  use: { baseURL: "http://127.0.0.1:3100" },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
  },
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
    {
      name: "chrome-stable",
      testMatch: /quality\.spec\.ts/,
      use: { channel: "chrome" },
    },
    {
      name: "edge-stable",
      testMatch: /quality\.spec\.ts/,
      use: { channel: "msedge" },
    },
    {
      name: "mobile-chromium-emulated",
      testMatch: /quality\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-webkit-emulated",
      testMatch: /quality\.spec\.ts/,
      use: { ...devices["iPhone 13"] },
    },
  ],
});
