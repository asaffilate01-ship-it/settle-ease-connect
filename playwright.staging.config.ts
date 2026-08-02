import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e-staging",
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: [["github"], ["line"]],
  outputDir: "test-results/staging",
  use: {
    baseURL: process.env.STAGING_URL,
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "staging-desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "staging-mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
