import { expect, test, type Page } from "@playwright/test"
import { gotoStub, pixelPngPath } from "./helpers.ts"

async function burnCurrentObject(page: Page): Promise<void> {
  for (let shot = 1; shot <= 6; shot++) {
    await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
    await expect(page.locator("li", { hasText: `Photo ${shot} · 0% close` }).first()).toBeVisible()
  }
}

async function dismissStats(page: Page): Promise<void> {
  const stats = page.getByRole("dialog", { name: "Statistics" })
  await expect(stats).toBeVisible()
  await stats.getByRole("button", { name: "Close", exact: true }).first().click()
  await expect(stats).toBeHidden({ timeout: 10_000 })
}

test("day opens on object 1 with a position indicator", async ({ page }) => {
  await gotoStub(page, "stub")
  await expect(page.getByRole("button", { name: /Take photo \(6 guesses left\)/ })).toBeVisible()
  await expect(page.getByText("Starting hint")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Try another object? (1/3)", exact: true }),
  ).toBeVisible()
})

test("switch advances to object 2 with a fresh 6", async ({ page }) => {
  await gotoStub(page, "stub")
  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.getByRole("button", { name: /Take photo \(5 guesses left\)/ })).toBeVisible()

  // First tap only arms the confirm; the run is untouched.
  await page.getByRole("button", { name: /Try another object\? \(1\/3\)/ }).click()
  await expect(page.getByRole("button", { name: "Tap again to confirm" })).toBeVisible()
  await expect(page.locator("li", { hasText: "Photo 1 · 0% close" }).first()).toBeVisible()

  // Second tap clears the run and opens object 2.
  await page.getByRole("button", { name: "Tap again to confirm" }).click()
  await expect(page.getByRole("button", { name: /Take photo \(6 guesses left\)/ })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Try another object? (2/3)", exact: true }),
  ).toBeVisible()
  await expect(page.locator("main ol li")).toHaveCount(0)

  // Scoring stays live on the new object: a real upload scores at once.
  await page.locator('input[type="file"]').setInputFiles(pixelPngPath())
  await expect(page.locator("li", { hasText: "Photo 1 · 0% close" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: /Take photo \(5 guesses left\)/ })).toBeVisible()
})

test("failing all three ends the day without naming objects early", async ({ page }) => {
  await gotoStub(page, "stub")
  const early = await page.locator("main").innerText()

  await burnCurrentObject(page)
  await expect(page.getByText(/Out of photos on /)).toBeVisible()
  // A burned run opens stats, like the day end. The open dialog hides the
  // board from role queries, so dismiss it before asserting the board.
  const failedStats = page.getByRole("dialog", { name: "Statistics" })
  await expect(failedStats).toBeVisible()
  await expect(failedStats.getByText("Played")).toBeVisible()
  await dismissStats(page)
  await expect(page.getByText("0 guesses left")).toBeVisible()
  await expect(page.getByRole("button", { name: /Try another object\? \(1\/3\)/ })).toBeEnabled()
  // One tap moves on from a dead run. No confirm.
  await page.getByRole("button", { name: /Try another object\? \(1\/3\)/ }).click()
  await expect(page.getByRole("button", { name: /Take photo \(6 guesses left\)/ })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Try another object? (2/3)", exact: true }),
  ).toBeVisible()

  await burnCurrentObject(page)
  await dismissStats(page)
  await page.getByRole("button", { name: "Continue to object 3", exact: true }).click()

  await burnCurrentObject(page)
  await dismissStats(page)
  await expect(page.getByText("Out of photos")).toBeVisible()
  const reveal = await page.getByText(/Today's objects: /).innerText()
  const objects = reveal.replace("Today's objects: ", "").replace(/\.$/, "").split(", ")
  expect(objects).toHaveLength(3)
  for (const object of objects) {
    expect(early).not.toContain(object)
  }
  await expect(page.getByText(/Next day in \d\d:\d\d:\d\d/)).toBeVisible()
})

test("solving after a switch names both objects in the share card", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/?e2eScorer=stub&dev=1", { waitUntil: "domcontentloaded" })
  const start = page.getByRole("button", { name: "Start playing", exact: true })
  await start.waitFor({ timeout: 15_000 })
  await start.click()

  await page.getByRole("button", { name: /Try another object\? \(1\/3\)/ }).click()
  await page.getByRole("button", { name: "Tap again to confirm" }).click()

  await page.getByLabel("Developer mode").getByRole("button", { name: "Solve now" }).click()
  await expect(page.getByText("Found it!")).toBeVisible()

  const reveal = await page.getByText(/It was .*\. Found in 1 photo/).innerText()
  const match = /It was (.+)\. Found in 1 photo.*Skipped: (.+)\./.exec(reveal)
  if (match === null) {
    throw new Error(`reveal did not parse: ${reveal}`)
  }
  const [, solvedLabel, quitLabel] = match

  const dialog = page.getByRole("dialog", { name: "Statistics" })
  await dialog.getByRole("button", { name: "Share score" }).click()
  const shared = await page.evaluate(() => window.navigator.clipboard.readText())
  expect(shared).toContain(`(${solvedLabel})`)
  expect(shared).toContain("1/6")
  expect(shared).toContain(`skipped: ${quitLabel}`)

  // Stats record the winning run only: played once, one win in 1 guess.
  const stats = await page.evaluate(() => window.localStorage.getItem("snapdle:v1:stats"))
  expect(stats ?? "").toContain('"played":1')
  expect(stats ?? "").toContain('"byGuesses":[1,0,0,0,0,0]')
})

test("a picker-era save revives onto object 1", async ({ page }) => {
  await gotoStub(page, "stub")
  await expect(page.getByRole("button", { name: /Take photo \(6 guesses left\)/ })).toBeVisible()

  // Rewrite the save as the old picker shape: no choice yet, no guesses.
  await page.evaluate(() => {
    const keys: Array<string> = []
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index)
      if (key !== null && key.startsWith("snapdle:v2:day:")) {
        keys.push(key)
      }
    }
    for (const key of keys) {
      const stored = JSON.parse(window.localStorage.getItem(key) ?? "{}") as {
        day?: Record<string, unknown>
        thumbnails?: unknown
      }
      window.localStorage.setItem(
        key,
        JSON.stringify({ ...stored, day: { ...stored.day, choiceId: null, guesses: [] } }),
      )
    }
  })
  await page.reload()
  await expect(page.getByRole("button", { name: /Take photo \(6 guesses left\)/ })).toBeVisible()
  await expect(page.getByText("Starting hint")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Try another object? (1/3)", exact: true }),
  ).toBeVisible()
})
