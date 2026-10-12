import { expect, test } from "@playwright/test"
import { gotoStub, pixelPngPath } from "./helpers.ts"

test("picker offers three subjects, choice starts a fresh run", async ({ page }) => {
  await gotoStub(page, "stub", { pick: false })
  await expect(page.getByText("Pick today's subject")).toBeVisible()
  await expect(page.getByRole("button", { name: /^Choose / })).toHaveCount(3)
  await expect(page.getByRole("button", { name: /Take photo/ })).toHaveCount(0)

  await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .click()
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()
  await expect(page.getByText("Starting hint")).toBeVisible()
  await expect(page.getByText("Pick today's subject")).toHaveCount(0)
})

test("two-tap give-up kills the pick and returns to the picker", async ({ page }) => {
  await gotoStub(page, "stub")
  const giveUp = page.getByRole("button", { name: /^Give up on / })
  const picked = await giveUp.getAttribute("aria-label")

  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.locator("li", { hasText: "Photo 1 · 0% close" }).first()).toBeVisible()

  // First tap only arms the confirm; the run is untouched.
  await giveUp.click()
  await expect(page.getByRole("button", { name: /^Confirm giving up on / })).toBeVisible()
  await expect(page.locator("li", { hasText: "Photo 1 · 0% close" }).first()).toBeVisible()

  // Second tap clears the run and kills the pick for the day.
  await page.getByRole("button", { name: /^Confirm giving up on / }).click()
  await expect(page.getByText("Pick today's subject")).toBeVisible()
  await expect(page.getByRole("button", { name: /Take photo/ })).toHaveCount(0)
  await expect(page.locator("ol li", { hasText: "Out for today" })).toHaveCount(1)
  expect(picked).toContain("Give up on ")

  // The next pick starts a fresh 6.
  await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .click()
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()
})

test("solving after a give-up names both prompts in the share card", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await gotoStub(page, "stub")

  const firstLabel = await page
    .getByRole("button", { name: /^Give up on / })
    .getAttribute("aria-label")
  const quitLabel = (firstLabel ?? "").replace("Give up on ", "")
  await page.getByRole("button", { name: /^Give up on / }).click()
  await page.getByRole("button", { name: /^Confirm giving up on / }).click()

  const solveLabel = await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .getAttribute("aria-label")
  const picked = (solveLabel ?? "").replace("Choose ", "")
  await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .click()

  await page.goto(`${page.url().split("?")[0]}?e2eScorer=solve`)
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.getByText("Found it!")).toBeVisible()
  await expect(page.getByText(`It was ${picked} — found in 1 photo`)).toBeVisible()

  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "Share score" }).click()
  const shared = await page.evaluate(() => window.navigator.clipboard.readText())
  expect(shared).toContain(`(${picked})`)
  expect(shared).toContain("1/6")
  expect(shared).toContain(`gave up: ${quitLabel}`)
})

test("burning all three triples ends the day with every subject named", async ({ page }) => {
  await gotoStub(page, "stub")
  for (let round = 0; round < 3; round++) {
    for (let shot = 1; shot <= 6; shot++) {
      await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
      await expect(
        page.locator("li", { hasText: `Photo ${shot} · 0% close` }).first(),
      ).toBeVisible()
    }
    if (round < 2) {
      await expect(page.getByText(/Out of photos on /)).toBeVisible()
      await page
        .getByRole("button", { name: /^Choose / })
        .first()
        .click()
    }
  }
  await expect(page.getByText("Out of photos")).toBeVisible()
  await expect(page.getByText(/Today's subjects were: /)).toBeVisible()
  await expect(page.getByText(/Next day in \d\d:\d\d:\d\d/)).toBeVisible()
})
