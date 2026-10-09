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
  await gotoStub(page, "stub")

  await expect(page.getByRole("heading", { name: "Touchgrassdle" })).toBeVisible()
  await expect(page.getByRole("heading", { name: /Hunt #\d+/ })).toBeVisible()
  await expect(page.getByRole("button", { name: /Shoot \(6 left\)/ })).toBeVisible()
  await expect(page.getByText("No shots yet. Go outside and shoot something.")).toBeVisible()
  await expect(page.getByTitle("Dark theme")).toBeVisible()
  expect(errors).toEqual([])
})
