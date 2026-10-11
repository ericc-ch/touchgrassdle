import { expect, test } from "@playwright/test"
import { gotoStub, pixelPngPath } from "./helpers.ts"

/**
 * Navbar/body padding regression: the header inner container and the main
 * inner container share one pattern (mx-auto w-full max-w-md px-4), so
 * their left and right edges must match exactly. Two widths: desktop
 * (centered max-w-md) and mobile (full-bleed).
 */
for (const { name, width } of [
  { name: "desktop", width: 1280 },
  { name: "mobile", width: 390 },
] as const) {
  test(`header and body padding match exactly (${name})`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await gotoStub(page, "stub")

    const headerBox = await page.locator("header > div").boundingBox()
    const bodyBox = await page.locator("main > div").boundingBox()
    expect(headerBox).not.toBe(null)
    expect(bodyBox).not.toBe(null)
    expect(headerBox?.x).toBe(bodyBox?.x)
    expect(headerBox?.width).toBe(bodyBox?.width)
  })
}

test("attempt shares the hint language and zooms on click", async ({ page }) => {
  await gotoStub(page, "stub")
  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())

  const row = page.locator("li", { hasText: "Photo 1 · 0% close" }).first()
  await expect(row).toBeVisible()
  await expect(row.getByText("Starting hint")).toHaveCount(0)

  await row.getByRole("button", { name: "Zoom photo 1" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("Photo 1")).toBeVisible()
  await expect(dialog.getByText(/0% close/)).toBeVisible()
  await dialog.getByRole("button", { name: "Close" }).click()
  await expect(dialog).toBeHidden()
})
