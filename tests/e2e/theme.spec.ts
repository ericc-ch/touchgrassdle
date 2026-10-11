import { expect, test } from "@playwright/test"
import { gotoStub } from "./helpers.ts"

test("theme toggle persists across reload", async ({ page }) => {
  await gotoStub(page, "stub")
  await expect(page.getByRole("button", { name: /Take photo/ })).toBeVisible()

  await page.getByTitle("Dark theme").click()
  await expect
    .poll(() => page.evaluate(() => window.document.documentElement.dataset["theme"]))
    .toBe("dark")

  await page.reload()
  await expect
    .poll(() => page.evaluate(() => window.document.documentElement.dataset["theme"]))
    .toBe("dark")
  await expect(page.evaluate(() => window.localStorage.getItem("snapdle:theme"))).resolves.toBe(
    "dark",
  )

  await page.getByTitle("Light theme").click()
  await expect
    .poll(() => page.evaluate(() => window.document.documentElement.dataset["theme"]))
    .toBe("light")
})
