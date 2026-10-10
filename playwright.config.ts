import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/live",
  timeout: 90_000,
  retries: 1,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { trace: "retain-on-failure" },
});
