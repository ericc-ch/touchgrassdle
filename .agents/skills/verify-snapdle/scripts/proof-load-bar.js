/**
 * Cold-load bar proof for the verify skill (not part of `pnpm check`).
 * Clears this origin's caches, then loads the real scorer and samples the
 * visible "Loading the photo scorer: N%" label until ready. Checks the
 * trajectory: starts low, only climbs, keeps moving, never shows 100%, and
 * ends ready. Prints `TRAIL t=<s> pct=<n>` lines and a RESULT line.
 *
 * Run: playwriter -s <id> --timeout 600000 -f <this file>
 * Needs a dev server or preview already serving the app (see SKILL.md).
 * Uses a throwaway 127.0.0.1 page; the user's tabs and day are untouched.
 */
const ORIGIN = "http://127.0.0.1:5173/";
const MAX_SECONDS = 550;

const readLabel = () =>
  state.page.evaluate(() => {
    // Scope to the How-to-Play dialog: the capture button behind it also
    // reads "Loading the photo scorer…" and has no percentage.
    const dialog = document.querySelector('[data-slot="dialog-content"]');
    const button =
      dialog === null
        ? null
        : [...dialog.querySelectorAll("button")].find((candidate) =>
            /Start playing|Loading the photo scorer/.test(candidate.textContent ?? ""),
          );
    return {
      error: document.body.innerText.includes("photo scorer cannot load"),
      label: button ? (button.textContent ?? "").trim() : null,
    };
  });

const waitForApp = (text) =>
  state.page.waitForFunction((needle) => document.body.innerText.includes(needle), text);

state.page = await context.newPage();
await state.page.goto(ORIGIN, { waitUntil: "domcontentloaded" });
// Let the app (and Vite's dev client) settle before touching storage: a dev
// reload mid-evaluate destroys the execution context.
await waitForApp("Snapdle");

// Fresh cold load on this origin: no cached weights, no first-visit flags.
// Retry around dev-server reloads so the clear always lands.
for (let attempt = 0; attempt < 5; attempt++) {
  try {
    await state.page.evaluate(async () => {
      for (const key of await caches.keys()) {
        await caches.delete(key);
      }
      window.localStorage.clear();
    });
    break;
  } catch {
    await waitForApp("Snapdle");
  }
}
await state.page.reload({ waitUntil: "domcontentloaded" });
await waitForApp("Loading the photo scorer");

const samples = [];
const started = Date.now();
let outcome = "timeout";
for (;;) {
  const elapsed = Math.round((Date.now() - started) / 1000);
  try {
    const read = await readLabel();
    if (read.error) {
      outcome = "error";
      break;
    }
    if (read.label !== null && read.label.includes("Start playing")) {
      samples.push({ elapsed, pct: null, label: "(ready)" });
      outcome = "ready";
      break;
    }
    const match = read.label === null ? null : /(\d+)%/.exec(read.label);
    samples.push({
      elapsed,
      pct: match ? Number(match[1]) : null,
      label: read.label ?? "(no button)",
    });
  } catch {
    samples.push({ elapsed, pct: null, label: "(navigating)" });
  }
  if (elapsed >= MAX_SECONDS) {
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
}

for (const sample of samples) {
  console.log(`TRAIL t=${sample.elapsed}s pct=${sample.pct ?? "-"} ${sample.label}`);
}

const numeric = samples.filter((sample) => typeof sample.pct === "number");
const first = numeric.length > 0 ? numeric[0].pct : null;
const max = numeric.reduce((acc, sample) => Math.max(acc, sample.pct), -1);
let regressions = 0;
let maxStall = 0;
let lastRiseAt = numeric.length > 0 ? numeric[0].elapsed : 0;
let previous = numeric.length > 0 ? numeric[0].pct : null;
for (const sample of numeric.slice(1)) {
  if (sample.pct < previous) {
    regressions++;
  }
  if (sample.pct > previous) {
    if (previous < 99) {
      maxStall = Math.max(maxStall, sample.elapsed - lastRiseAt);
    }
    lastRiseAt = sample.elapsed;
  }
  previous = sample.pct;
}
// The final stretch counts only below the cap: resting at 99% until ready
// is the design, not a stall.
if (previous !== null && previous < 99) {
  const lastElapsed = samples.at(-1)?.elapsed ?? 0;
  maxStall = Math.max(maxStall, lastElapsed - lastRiseAt);
}

const pass =
  outcome === "ready" &&
  regressions === 0 &&
  max >= 0 &&
  max < 100 &&
  first !== null &&
  first <= 20 &&
  maxStall <= 45;
console.log(
  `RESULT outcome=${outcome} first=${first} max=${max} regressions=${regressions} max_stall=${maxStall}s pass=${pass}`,
);
