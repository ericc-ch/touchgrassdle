import { expect, test } from "@playwright/test"
import { gotoStub } from "./helpers.ts"

test("theme and contrast persist across reload", async ({ page }) => {
  await gotoStub(page, "stub")
  await expect(page.getByRole("button", { name: /Shoot/ })).toBeVisible()

  await page.getByTitle("Dark theme").click()
  await expect
    .poll(() => page.evaluate(() => window.document.documentElement.dataset["theme"]))
    .toBe("dark")

  await page.getByTitle("High contrast").click()
  await expect
    .poll(() => page.evaluate(() => window.document.documentElement.dataset["contrast"]))
    .toBe("high")

  await page.reload()
  await expect
    .poll(() => page.evaluate(() => window.document.documentElement.dataset["theme"]))
    .toBe("dark")
  await expect
    .poll(() => page.evaluate(() => window.document.documentElement.dataset["contrast"]))
    .toBe("high")
  await expect(
    page.evaluate(() => window.localStorage.getItem("touchgrassdle:theme")),
  ).resolves.toBe("dark")
  await expect(
    page.evaluate(() => window.localStorage.getItem("touchgrassdle:contrast")),
  ).resolves.toBe("high")
})
