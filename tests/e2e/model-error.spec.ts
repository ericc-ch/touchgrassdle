import { expect, test } from "@playwright/test"
import { gotoStub } from "./helpers.ts"

test("scorer failure shows photo-scorer-unavailable with retry", async ({ page }) => {
  await gotoStub(page, "fail")

  // First visit surfaces the failure inside How to Play.
  const howTo = page.getByRole("dialog", { name: "How to play" })
  await expect(howTo.getByText("The photo scorer cannot load.")).toBeVisible()

  // Dismissing it leaves the slim loader with the same Retry path.
  await howTo.getByRole("button", { name: "Close", exact: true }).click()
  const board = page.locator("main")
  await expect(board.getByText("Photo scorer unavailable")).toBeVisible()
  await expect(board.getByRole("button", { name: "Retry" })).toBeVisible()

  // Retry re-attempts and deterministically fails again.
  await board.getByRole("button", { name: "Retry" }).click()
  await expect(board.getByText("Photo scorer unavailable")).toBeVisible()
})
