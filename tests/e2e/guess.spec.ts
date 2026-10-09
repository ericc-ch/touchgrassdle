import { expect, test } from "@playwright/test"
import { gotoStub, pixelPngPath } from "./helpers.ts"

// The stub scorer returns a 1-d vector against 768-d prompt embeddings,
// so cosine is 0 and the fixed logistic maps it to exactly 7 (Frozen).
test("capture scores a Frozen guess and it survives reload", async ({ page }) => {
  await gotoStub(page, "stub")
  await expect(page.getByRole("button", { name: /Shoot \(6 left\)/ })).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  const card = page.locator("li", { hasText: "Frozen" }).first()
  await expect(card).toBeVisible()
  await expect(card.getByText("7", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /Shoot \(5 left\)/ })).toBeVisible()

  const keys = await page.evaluate(() => Object.keys(window.localStorage))
  expect(keys.some((key) => key.startsWith("touchgrassdle:v1:day:"))).toBe(true)

  await page.reload()
  await expect(page.locator("li", { hasText: "Frozen" }).first()).toBeVisible()
  await expect(page.locator('ol img[alt="Guess 1"]')).toBeVisible()
})
