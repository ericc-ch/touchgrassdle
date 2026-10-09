import { defineConfig } from "vitest/config"

// Unit tests only. Browser E2E lives in tests/e2e (Playwright)
// and would fail under vitest (no browser, no page fixture).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
})
