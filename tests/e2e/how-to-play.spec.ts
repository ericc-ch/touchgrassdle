import { expect, test } from "@playwright/test"

test("first visit shows How to Play, Play starts the hunt and persists", async ({ page }) => {
  await page.goto("/?e2eScorer=stub", { waitUntil: "domcontentloaded" })

  const dialog = page.getByRole("dialog", { name: "How to play" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText("80 points solves the hunt.")).toBeVisible()

  const start = dialog.getByRole("button", { name: "Start hunting" })
  await expect(start).toBeEnabled()
  await start.click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole("button", { name: /Shoot \(6 left\)/ })).toBeVisible()

  const seen = await page.evaluate(() => window.localStorage.getItem("touchgrassdle:v1:seenHowTo"))
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
  await expect(dialog.getByText("The judge cannot load.")).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Retry" })).toBeVisible()
})
