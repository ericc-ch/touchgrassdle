/**
 * Evidence capture for the verification skill (not part of `pnpm check`).
 * Drives the skill's preview instance (port 4173, see launch.sh) with a
 * stubbed scorer and writes screenshots + transcript to .audit/evidence/.
 *
 * Run: `pnpm exec tsx .agents/skills/verify-touchgrassdle/scripts/evidence.ts`
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execSync } from "node:child_process"
import { chromium } from "@playwright/test"

const ORIGIN = "http://127.0.0.1:4173"
const OUT = join(process.cwd(), ".audit", "evidence")
const PIXEL_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

function browserPath(): string | undefined {
  if (process.env["E2E_BROWSER"] !== undefined && process.env["E2E_BROWSER"] !== "") {
    return process.env["E2E_BROWSER"]
  }
  try {
    return execSync("command -v helium").toString().trim() || undefined
  } catch {
    return undefined
  }
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true })
  const pixel = join(tmpdir(), "touchgrassdle-pixel.png")
  writeFileSync(pixel, Buffer.from(PIXEL_PNG, "base64"), { flag: "w" })

  const executablePath = browserPath()
  const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath })
  const transcript: Record<string, unknown> = { origin: ORIGIN }
  try {
    const context = await browser.newContext()
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    const page = await context.newPage()
    const errors: Array<string> = []
    page.on("pageerror", (error) => errors.push(String(error)))
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text())
      }
    })

    await page.goto(`${ORIGIN}/?e2eScorer=stub`, { waitUntil: "domcontentloaded" })
    await page.getByRole("button", { name: /Shoot \(6 left\)/ }).waitFor({ timeout: 30_000 })
    await page.locator('input[type="file"]').setInputFiles(pixel)
    await page.locator("li", { hasText: "Frozen" }).first().waitFor({ timeout: 30_000 })
    transcript["stubGuess"] = await page.locator("li", { hasText: "Frozen" }).first().innerText()
    transcript["storageKeys"] = await page.evaluate(() => Object.keys(window.localStorage))
    await page.screenshot({ path: join(OUT, "board.png"), scale: "css" })

    await page.goto(`${ORIGIN}/?e2eScorer=solve`, { waitUntil: "domcontentloaded" })
    await page.evaluate(() => window.localStorage.clear())
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.getByRole("button", { name: /Shoot \(6 left\)/ }).waitFor({ timeout: 30_000 })
    await page.locator('input[type="file"]').setInputFiles(pixel)
    await page.getByText("Solved!").waitFor({ timeout: 30_000 })
    const dialog = page.getByRole("dialog")
    await dialog.waitFor({ timeout: 10_000 })
    await dialog.getByRole("button", { name: "Share score" }).click()
    transcript["shareCard"] = await page.evaluate(() => window.navigator.clipboard.readText())
    await page.screenshot({ path: join(OUT, "solved.png"), scale: "css" })

    transcript["consoleErrors"] = errors
    writeFileSync(join(OUT, "transcript.json"), `${JSON.stringify(transcript, null, 2)}\n`)
    if (errors.length > 0) {
      throw new Error(`console errors: ${errors.join("; ")}`)
    }
    console.log("evidence ok")
  } finally {
    await browser.close()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
