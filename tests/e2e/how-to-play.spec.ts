import { expect, test } from "@playwright/test"

test("first visit shows How to Play, Play starts the game and persists", async ({ page }) => {
  await page.goto("/?e2eScorer=stub", { waitUntil: "domcontentloaded" })

  const dialog = page.getByRole("dialog", { name: "How to play" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("80% or more finds it.")).toBeVisible()

  const start = dialog.getByRole("button", { name: "Start playing" })
  await expect(start).toBeEnabled()
  await start.click()
  await expect(dialog).toBeHidden()
  await page
    .getByRole("button", { name: /^Choose/ })
    .first()
    .click()
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()

  const seen = await page.evaluate(() => window.localStorage.getItem("snapdle:v2:seenHowTo"))
  expect(seen).toBe("1")

  // Reload stays in the game; the ? button reopens the rules.
  await page.reload()
  await expect(page.getByRole("dialog", { name: "How to play" })).toBeHidden()
  await page.getByRole("button", { name: "How to play" }).click()
  await expect(page.getByRole("dialog", { name: "How to play" })).toBeVisible()
})

test("scorer failure surfaces Retry inside How to Play", async ({ page }) => {
  await page.goto("/?e2eScorer=fail", { waitUntil: "domcontentloaded" })

  const dialog = page.getByRole("dialog", { name: "How to play" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("The photo scorer cannot load.")).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Retry" })).toBeVisible()
})

test.describe("photo scorer explainer", () => {
  test.use({ hasTouch: true })

  test("tap toggles the explainer", async ({ page }) => {
    await page.goto("/?e2eScorer=stub", { waitUntil: "domcontentloaded" })

    const dialog = page.getByRole("dialog", { name: "How to play" })
    await expect(dialog).toBeVisible()

    const explainer = page.getByText(
      "Compares your photo to today's hidden object on this device, 0 to 100%.",
    )
    await expect(explainer).toBeHidden()

    const term = dialog.getByText("photo scorer", { exact: true })
    await term.tap()
    await expect(explainer).toBeVisible()

    await term.tap()
    await expect(explainer).toBeHidden()
  })

  test("keyboard opens the explainer and Escape closes it", async ({ page }) => {
    await page.goto("/?e2eScorer=stub", { waitUntil: "domcontentloaded" })

    const dialog = page.getByRole("dialog", { name: "How to play" })
    await expect(dialog).toBeVisible()

    const explainer = page.getByText(
      "Compares your photo to today's hidden object on this device, 0 to 100%.",
    )
    await expect(explainer).toBeHidden()

    await dialog.getByText("photo scorer", { exact: true }).focus()
    await page.keyboard.press("Enter")
    await expect(explainer).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(explainer).toBeHidden()
  })
})
