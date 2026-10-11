import { expect, test, type Page } from "@playwright/test"
import { gotoStub } from "./helpers.ts"

function themeToggle(page: Page) {
  return page.getByRole("button", { name: /^Switch to (light|dark) theme$/ })
}

async function tapThemeSwitch(page: Page, times: number): Promise<void> {
  const toggle = themeToggle(page)
  for (let index = 0; index < times; index++) {
    await toggle.click()
  }
}

test("ten quick theme taps toggle dev mode on and off", async ({ page }) => {
  await gotoStub(page, "stub")
  const drawer = page.getByLabel("Developer mode")

  await tapThemeSwitch(page, 9)
  await expect(drawer).toBeHidden()

  await tapThemeSwitch(page, 1)
  await expect(drawer).toBeVisible()

  await tapThemeSwitch(page, 10)
  await expect(drawer).toBeHidden()
})

test("a pause longer than the tap window resets the count", async ({ page }) => {
  await gotoStub(page, "stub")
  const drawer = page.getByLabel("Developer mode")

  await tapThemeSwitch(page, 6)
  await page.waitForTimeout(2_000)
  await tapThemeSwitch(page, 5)
  await expect(drawer).toBeHidden()

  await tapThemeSwitch(page, 5)
  await expect(drawer).toBeVisible()
})

test("?dev=1 still opens dev mode for the session", async ({ page }) => {
  await page.goto("/?e2eScorer=stub&dev=1", { waitUntil: "domcontentloaded" })
  const start = page.getByRole("button", { name: "Start playing", exact: true })
  await start.waitFor({ timeout: 15_000 })
  await start.click()

  await expect(page.getByLabel("Developer mode")).toBeVisible()
})

test("loading section drives the bar and the How-to-Play label", async ({ page }) => {
  await page.goto("/?e2eScorer=stub&dev=1", { waitUntil: "domcontentloaded" })
  const start = page.getByRole("button", { name: "Start playing", exact: true })
  await start.waitFor({ timeout: 15_000 })
  await start.click()

  await page.getByLabel("Developer mode").getByRole("button", { name: "99%" }).click()
  await expect(page.getByText("Getting the photo scorer ready…")).toBeVisible()

  await page.getByRole("button", { name: "How to play", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "How to play" })
  await expect(dialog.getByText("Loading the photo scorer: 99%")).toBeVisible()
})
