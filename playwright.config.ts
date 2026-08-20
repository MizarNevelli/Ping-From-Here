import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Each spec file is fully independent — no shared state between tests
  fullyParallel: true,
  // Hard fail on accidental test.only left in CI
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3458",
    // Capture full trace on first retry only (not every run)
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3458",
    port: 3458,
    // Reuse the dev server if already running locally; always restart in CI
    reuseExistingServer: !process.env.CI,
  },
});
