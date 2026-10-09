import { defineConfig } from "@playwright/test"

// Helium override, same convention as scripts/smoke-browser.ts.
// Unset (or empty) = Playwright's bundled Chromium.
const browserPath = process.env["E2E_BROWSER"] || undefined

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    ...(browserPath === undefined ? {} : { launchOptions: { executablePath: browserPath } }),
  },
  webServer: {
    command: "pnpm preview --host 127.0.0.1 --port 4173 --strictPort",
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
