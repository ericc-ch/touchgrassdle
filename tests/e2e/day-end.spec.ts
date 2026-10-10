import { expect, test } from "@playwright/test"
import { gotoStub, pixelPngPath } from "./helpers.ts"

test("solving shows reveal, share card, stats, and stays solved", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await gotoStub(page, "solve")
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.getByText("Found it!")).toBeVisible()
  await expect(page.getByText(/Next day in \d\d:\d\d:\d\d/)).toBeVisible()

  // Stats auto-opens on day end. Share from inside the dialog
  // (it overlays the SolvedCard underneath).
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("Played")).toBeVisible()

  await dialog.getByRole("button", { name: "Share score" }).click()
  const shared = await page.evaluate(() => window.navigator.clipboard.readText())
  expect(shared.startsWith("Touchgrassdle #")).toBe(true)
  expect(shared).toContain("1/6")
  expect(shared).toContain("🟥")

  // Reload records nothing twice: still solved, still played once.
  await page.reload()
  await expect(page.getByText("Found it!")).toBeVisible()
  const stats = await page.evaluate(() => window.localStorage.getItem("touchgrassdle:v1:stats"))
  expect(stats ?? "").toContain('"played":1')
})
