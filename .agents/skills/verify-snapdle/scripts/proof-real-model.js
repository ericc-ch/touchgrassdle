/**
 * Real-model proof for the verify skill (not part of `pnpm check`).
 * Scores two real photos in the user's live browser via playwriter:
 * a match for the day's object and a non-match. Prints
 * `RESULT match=<n> non=<m> pass=true|false`.
 *
 * Run: playwriter -s <id> --timeout 600000 -f <this file>
 * Needs a dev server or preview already serving the app (see SKILL.md).
 * Uses a throwaway 127.0.0.1 page; the user's tabs and day are untouched.
 *
 * Photo fixtures: /tmp/snapdle-calib/<prompt>-<0|1>.jpg, written by
 * scripts/calibrate-scoring.ts. If a fixture is missing, re-run that script
 * (weights cached, only the missing photo step matters) or swap in any
 * clearly-matching / clearly-wrong JPEG and update the paths below.
 * The non-match must avoid all 3 objects of the day's triple.
 */
const ORIGIN = "http://127.0.0.1:5173/";
const MATCH_PHOTO = "/tmp/snapdle-calib/bicycle-0.jpg";
const NON_PHOTO = "/tmp/snapdle-calib/sleeping-cat-0.jpg";
// Proving the preview (4173) instead of dev: change ORIGIN to
// "http://127.0.0.1:4173/". Proving a different day: MATCH_PHOTO must
// depict that day's first object (see tripleFor in src/game/prompts.ts);
// every object has fixtures from scripts/calibrate-scoring.ts.
const SHOT = "/home/erickc/projects/touchgrassdle/.audit/evidence/pw-eg2-proof.png";

state.page = await context.newPage();
await state.page.goto(ORIGIN, { waitUntil: "domcontentloaded" });
const start = state.page.getByRole("button", { name: "Start playing", exact: true });
await start.waitFor({ timeout: 600_000 });
await start.click();
await state.page.getByRole("button", { name: /Take photo \(\d guesses left\)/ }).waitFor({ timeout: 60_000 });
console.log("READY " + ORIGIN);
await state.page.locator('input[type="file"]').setInputFiles(MATCH_PHOTO);
await state.page.locator("main li").first().waitFor({ timeout: 180_000 });
const match = await state.page.locator("main li").first().innerText();
console.log("MATCH: " + JSON.stringify(match));
await state.page.locator('input[type="file"]').setInputFiles(NON_PHOTO);
await state.page.locator("main li").nth(1).waitFor({ timeout: 180_000 });
const non = await state.page.locator("main li").nth(1).innerText();
console.log("NON: " + JSON.stringify(non));
const num = (s) => Number(s.split("%")[0]);
console.log(`RESULT match=${num(match)} non=${num(non)} pass=${num(match) > num(non)}`);
await state.page.screenshot({ path: SHOT, scale: "css" });
console.log("shot pw-eg2-proof");
