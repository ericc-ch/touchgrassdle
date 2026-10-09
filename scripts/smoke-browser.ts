/**
 * Headless browser proof (manual; needs network for the one-time model
 * download): loads the built app, plays the football photo, and asserts
 * a cold score lands on the board and survives reload.
 *
 * Run: `pnpm build && pnpm smoke:browser`
 */
import { spawn, type ChildProcess } from "node:child_process"
import { chromium } from "@playwright/test"

const ORIGIN = "http://127.0.0.1:4173"
const PHOTO =
  "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/football-match.jpg"

const download = async (url: string, path: string): Promise<void> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`download failed: ${url}`)
  }
  const { writeFile } = await import("node:fs/promises")
  await writeFile(path, Buffer.from(await response.arrayBuffer()))
}

const HELIUM = "/nix/store/xqss2hq4s45ngmp55jwf0yl65rivzgil-helium-0.18.3.1/bin/helium"

async function main(): Promise<void> {
  await download(PHOTO, "/tmp/opencode/football.jpg")

  const preview: ChildProcess = spawn("pnpm", ["preview"], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
  })
  const stopPreview = (): void => {
    if (preview.pid !== undefined) {
      try {
        process.kill(-preview.pid, "SIGTERM")
      } catch {
        preview.kill("SIGTERM")
      }
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 4000))

  const browser = await chromium.launch({
    executablePath: process.env["E2E_BROWSER"] ?? HELIUM,
    args: ["--no-sandbox", "--headless=new", "--enable-unsafe-swiftshader"],
  })
  try {
    const page = await browser.newPage()
    page.on("console", (message) => {
      if (message.type() === "error") {
        console.log("[page]", message.text().slice(0, 200))
      }
    })
    await page.goto(ORIGIN, { waitUntil: "domcontentloaded" })

    await page.getByRole("button", { name: /shoot/i }).waitFor({ timeout: 600_000 })
    console.log("model loaded")

    await page.locator('input[type="file"]').setInputFiles("/tmp/opencode/football.jpg")
    await page
      .getByText(/go outside|shots left|No shots/i)
      .first()
      .waitFor({ timeout: 300_000 })
    await page
      .locator("li", { hasText: /Frozen|Cool|Warm|Hot|Blazing/ })
      .first()
      .waitFor({ timeout: 300_000 })
    const firstGuess = await page
      .locator("li", { hasText: /Frozen|Cool|Warm|Hot|Blazing/ })
      .first()
      .innerText()
    console.log("guess card:", firstGuess.replace(/\n/g, " | ").slice(0, 160))

    await page.reload()
    await page
      .locator("li", { hasText: /Frozen|Cool|Warm|Hot|Blazing/ })
      .first()
      .waitFor({ timeout: 60_000 })
    console.log("persisted across reload")
    console.log("browser smoke ok")
  } finally {
    await browser.close()
    stopPreview()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
