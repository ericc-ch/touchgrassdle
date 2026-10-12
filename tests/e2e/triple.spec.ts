import { expect, test, type Page } from "@playwright/test"
import { gotoStub, pixelPngPath } from "./helpers.ts"

async function burnCurrentObject(page: Page): Promise<void> {
  for (let shot = 1; shot <= 6; shot++) {
    await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
    await expect(page.locator("li", { hasText: `Photo ${shot} · 0% close` }).first()).toBeVisible()
  }
}

test("day opens on object 1 with a position indicator", async ({ page }) => {
  await gotoStub(page, "stub")
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()
  await expect(page.getByText("Starting hint")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Try another object? (1/3)", exact: true }),
  ).toBeVisible()
})

test("switch advances to object 2 with a fresh 6", async ({ page }) => {
  await gotoStub(page, "stub")
  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.getByRole("button", { name: /Take photo \(5 left\)/ })).toBeVisible()

  // First tap only arms the confirm; the run is untouched.
  await page.getByRole("button", { name: /Try another object\? \(1\/3\)/ }).click()
  await expect(page.getByRole("button", { name: "Tap again to confirm" })).toBeVisible()
  await expect(page.locator("li", { hasText: "Photo 1 · 0% close" }).first()).toBeVisible()

  // Second tap clears the run and opens object 2.
  await page.getByRole("button", { name: "Tap again to confirm" }).click()
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Try another object? (2/3)", exact: true }),
  ).toBeVisible()
  await expect(page.locator("ol li")).toHaveCount(0)
})

test("failing all three ends the day without naming objects early", async ({ page }) => {
  await gotoStub(page, "stub")
  const early = await page.locator("main").innerText()

  await burnCurrentObject(page)
  await expect(page.getByText(/Out of photos on /)).toBeVisible()
  await page.getByRole("button", { name: "Continue to object 2", exact: true }).click()
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()

  await burnCurrentObject(page)
  await page.getByRole("button", { name: "Continue to object 3", exact: true }).click()

  await burnCurrentObject(page)
  await expect(page.getByText("Out of photos")).toBeVisible()
  const reveal = await page.getByText(/Today's objects: /).innerText()
  const objects = reveal.replace("Today's objects: ", "").replace(/\.$/, "").split(", ")
  expect(objects).toHaveLength(3)
  for (const object of objects) {
    expect(early).not.toContain(object)
  }
  await expect(page.getByText(/Next day in \d\d:\d\d:\d\d/)).toBeVisible()
})

test("solving after a switch names both objects in the share card", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await gotoStub(page, "stub")

  await page.getByRole("button", { name: /Try another object\? \(1\/3\)/ }).click()
  await page.getByRole("button", { name: "Tap again to confirm" }).click()

  await page.goto(`${page.url().split("?")[0]}?e2eScorer=solve`)
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.getByText("Found it!")).toBeVisible()

  const reveal = await page.getByText(/It was .*\. Found in 1 photo/).innerText()
  const match = /It was (.+)\. Found in 1 photo.*Skipped: (.+)\./.exec(reveal)
  expect(match).not.toBe(null)
  const [, solvedLabel, quitLabel] = match ?? []

  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "Share score" }).click()
  const shared = await page.evaluate(() => window.navigator.clipboard.readText())
  expect(shared).toContain(`(${solvedLabel})`)
  expect(shared).toContain("1/6")
  expect(shared).toContain(`skipped: ${quitLabel}`)
})
