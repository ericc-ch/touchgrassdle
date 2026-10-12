import { expect, test } from "@playwright/test"
import { gotoStub, pixelPngPath } from "./helpers.ts"

// The stub scorer returns a 1-d vector against 768-d prompt embeddings,
// so cosine is 0 and the fitted logistic maps it to exactly 0.
test("capture scores a 0% guess and it survives reload", async ({ page }) => {
  await gotoStub(page, "stub")
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  const card = page.locator("li", { hasText: "0% close" }).first()
  await expect(card).toBeVisible()
  await expect(page.getByRole("button", { name: /Take photo \(5 left\)/ })).toBeVisible()

  const keys = await page.evaluate(() => Object.keys(window.localStorage))
  expect(keys.some((key) => key.startsWith("snapdle:v2:day:"))).toBe(true)

  await page.reload()
  await expect(page.locator("li", { hasText: "0% close" }).first()).toBeVisible()
  await expect(page.locator('ol img[alt="Photo 1, 0% close"]')).toBeVisible()
})

test("same-score attempts show different hints, never the starting hint", async ({ page }) => {
  await gotoStub(page, "stub")
  const starting = await page.getByText("Starting hint").locator("..").innerText()

  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.locator("li", { hasText: "Photo 1 · 0% close" }).first()).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.locator("li", { hasText: "Photo 2 · 0% close" }).first()).toBeVisible()

  const clues = await page.locator("ol li p").allInnerTexts()
  expect(clues.length).toBe(2)
  expect(clues[0]).not.toBe(clues[1])
  for (const clue of clues) {
    expect(starting).not.toContain(clue)
  }
})
