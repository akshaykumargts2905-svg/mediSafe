import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 480000,
  expect: { timeout: 20000 },
  workers: 1,
  use: { baseURL: "http://localhost:3100", channel: process.env.E2E_BROWSER_CHANNEL || undefined, headless: true, actionTimeout: 30000, navigationTimeout: 45000, screenshot: "only-on-failure" },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100/login",
    timeout: 120000,
    reuseExistingServer: false,
    env: { MEDISAFE_API_URL: "http://127.0.0.1:5100", NEXT_PUBLIC_API_URL: "", NEXT_DIST_DIR: ".next-e2e" },
  },
});
