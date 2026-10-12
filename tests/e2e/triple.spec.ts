import { expect, test } from "@playwright/test"
import { gotoStub, pixelPngPath } from "./helpers.ts"

test("picker offers three subjects without naming them", async ({ page }) => {
  await gotoStub(page, "stub", { pick: false })
  await expect(page.getByText("Pick today's subject")).toBeVisible()
  const choices = page.getByRole("button", { name: /^Choose/ })
  await expect(choices).toHaveCount(3)
  await expect(choices.nth(0)).toHaveAttribute("aria-label", "Choose subject 1")
  await expect(choices.nth(1)).toHaveAttribute("aria-label", "Choose subject 2")
  await expect(choices.nth(2)).toHaveAttribute("aria-label", "Choose subject 3")
  await expect(page.getByRole("button", { name: /Take photo/ })).toHaveCount(0)
  const picker = await page.getByText("Pick today's subject").locator("..").innerText()

  // Burn the whole day to learn the labels from the reveal, then prove
  // the saved picker text named none of them.
  await choices.first().click()
  for (let round = 0; round < 3; round++) {
    for (let shot = 1; shot <= 6; shot++) {
      await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
      await expect(
        page.locator("li", { hasText: `Photo ${shot} · 0% close` }).first(),
      ).toBeVisible()
    }
    if (round < 2) {
      await page
        .getByRole("button", { name: /^Choose/ })
        .first()
        .click()
    }
  }
  const reveal = await page.getByText(/Today's subjects were: /).innerText()
  const subjects = reveal.replace("Today's subjects were: ", "").replace(/\.$/, "").split(", ")
  expect(subjects).toHaveLength(3)
  for (const subject of subjects) {
    expect(picker).not.toContain(subject)
  }
})

test("two-tap switch kills the pick and returns to the picker", async ({ page }) => {
  await gotoStub(page, "stub")
  const switchButton = page.getByRole("button", { name: "Try another subject?", exact: true })

  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.locator("li", { hasText: "Photo 1 · 0% close" }).first()).toBeVisible()

  // First tap only arms the confirm; the run is untouched.
  await switchButton.click()
  await expect(page.getByRole("button", { name: /^Confirm: end / })).toBeVisible()
  await expect(page.locator("li", { hasText: "Photo 1 · 0% close" }).first()).toBeVisible()

  // Second tap clears the run and kills the pick for the day.
  await page.getByRole("button", { name: /^Confirm: end / }).click()
  await expect(page.getByText("Pick today's subject")).toBeVisible()
  await expect(page.getByRole("button", { name: /Take photo/ })).toHaveCount(0)
  await expect(page.locator("ol li", { hasText: "Out for today" })).toHaveCount(1)

  // The next pick starts a fresh 6.
  await page
    .getByRole("button", { name: /^Choose/ })
    .first()
    .click()
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()
})

test("solving after a switch names both prompts in the share card", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await gotoStub(page, "stub")

  await page.getByRole("button", { name: "Try another subject?", exact: true }).click()
  await page.getByRole("button", { name: /^Confirm: end / }).click()
  await page
    .getByRole("button", { name: /^Choose/ })
    .first()
    .click()

  await page.goto(`${page.url().split("?")[0]}?e2eScorer=solve`)
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.getByText("Found it!")).toBeVisible()

  const reveal = await page.getByText(/It was .* — found in 1 photo/).innerText()
  const match = /It was (.+) — found in 1 photo.*Gave up: (.+)\./.exec(reveal)
  expect(match).not.toBe(null)
  const [, solvedLabel, quitLabel] = match ?? []

  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "Share score" }).click()
  const shared = await page.evaluate(() => window.navigator.clipboard.readText())
  expect(shared).toContain(`(${solvedLabel})`)
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
        .getByRole("button", { name: /^Choose/ })
        .first()
        .click()
    }
  }
  await expect(page.getByText("Out of photos")).toBeVisible()
  await expect(page.getByText(/Today's subjects were: /)).toBeVisible()
  await expect(page.getByText(/Next day in \d\d:\d\d:\d\d/)).toBeVisible()
})
