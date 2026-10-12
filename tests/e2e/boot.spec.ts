import { expect, test } from "@playwright/test"
import { gotoStub } from "./helpers.ts"

test("boot shows the empty board with no console errors", async ({ page }) => {
  const errors: Array<string> = []
  page.on("pageerror", (error) => errors.push(String(error)))
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text())
    }
  })
  await gotoStub(page, "stub", { pick: false })

  await expect(page.getByRole("heading", { name: "Snapdle" })).toBeVisible()
  await expect(page.getByRole("heading", { name: /Day #\d+/ })).toBeVisible()
  await expect(page.getByText("Pick today's subject")).toBeVisible()
  await expect(page.getByRole("button", { name: /^Choose/ })).toHaveCount(3)

  await page
    .getByRole("button", { name: /^Choose/ })
    .first()
    .click()
  await expect(page.getByRole("button", { name: /Take photo \(6 left\)/ })).toBeVisible()
  await expect(page.getByText("Starting hint")).toBeVisible()
  await expect(page.getByTitle("Dark theme")).toBeVisible()
  expect(errors).toEqual([])
})
