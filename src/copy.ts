/**
 * Every user-facing string in one place, English only. Screens import
 * from here instead of inlining copy, so wording changes land in one
 * file. Params stay function args (no sentence stitching at call
 * sites) to keep a future i18n pass simple.
 */

/** App chrome. */
export const appName = "Snapdle"
export const navLabel = "Game"
export const howToPlayAction = "How to play"
export const viewStatsAction = "View statistics"

/** Day header. */
export function dayHeading(dayNumber: number): string {
  return `Day #${dayNumber}`
}
export function foundStatus(best: number): string {
  return `found · best ${best}%`
}
export function guessesLeftStatus(remaining: number): string {
  return remaining === 1 ? "1 guess left" : `${remaining} guesses left`
}

/** Object picker. */
export const pickObjectHeading = "Pick today's object"
export function objectTitle(index: number): string {
  return `Object ${index + 1}`
}
export function chooseObjectLabel(index: number): string {
  return `Choose object ${index + 1}`
}
export function deadObjectNote(label: string): string {
  return `Out for today. It was ${label}.`
}

/** Starting hint card. */
export const startingHintHeading = "Starting hint"

/** Header object switch. */
export function switchIdleLabel(position: number, total: number): string {
  return `Try another object? (${position}/${total})`
}
export const switchIdleAction = "Try another object?"
export const switchConfirmAction = "Tap again to confirm"
export const switchConfirmHint = "Tap again to confirm. Photos reset."

/** Failed-run card. */
export function outOfPhotosHeading(label: string): string {
  return `Out of photos on ${label}`
}
export const failedRunBody =
  "That object stays dead. Pick another object below. You get 6 new photos."
export function continueAction(position: number): string {
  return `Continue to object ${position}`
}

/** Reveal card. */
export const foundTitle = "Found it!"
export const outOfPhotosTitle = "Out of photos"
export function photoCountWord(count: number): string {
  return count === 1 ? "photo" : "photos"
}
export interface FoundDescriptionInput {
  readonly label: string
  readonly guessesUsed: number
  readonly best: number
  readonly skipped: ReadonlyArray<string>
}
export function foundDescription(input: FoundDescriptionInput): string {
  const run = `It was ${input.label}. Found in ${input.guessesUsed} ${photoCountWord(input.guessesUsed)}. Best ${input.best}%.`
  return input.skipped.length === 0 ? run : `${run} Skipped: ${input.skipped.join(", ")}.`
}
export function failedDescription(labels: ReadonlyArray<string>): string {
  return `Today's objects: ${labels.join(", ")}.`
}
export interface StatsShareLabelInput {
  readonly dayNumber: number
  readonly solvedLabel: string | null
  readonly guessesUsed: number
  readonly over: boolean
  readonly position: number
}
export function statsShareLabel(input: StatsShareLabelInput): string {
  if (input.solvedLabel !== null) {
    return `Day #${input.dayNumber}, ${input.solvedLabel} found in ${input.guessesUsed}`
  }
  if (input.over) {
    return `Day #${input.dayNumber}, not found`
  }
  return `Day #${input.dayNumber}, object ${input.position} missed`
}

/** Share buttons. */
export const shareAction = "Share score"
export const sharedAction = "Copied!"

/** Capture button. */
export const checkingPhotoAction = "Checking photo…"
export const noPhotosAction = "No photos left"
export const captureWaitingAction = "Loading the photo scorer…"
export function takePhotoAction(remaining: number): string {
  return `Take photo (${remaining} guesses left)`
}

/** Guess list. */
export function zoomPhotoAction(index: number): string {
  return `Zoom photo ${index + 1}`
}
export function photoAlt(index: number, score: number): string {
  return `Photo ${index + 1}, ${score}% close`
}
export function photoTitle(index: number): string {
  return `Photo ${index + 1}`
}
export function photoHeading(index: number, score: number): string {
  return `Photo ${index + 1} · ${score}% close`
}
export function photoPreviewAlt(score: number | null): string {
  return score === null ? "Photo preview" : `Photo preview, ${score}% close`
}

/** How to Play. */
export const howToPlayTitle = "How to play"
export const howToPlayIntro =
  "Pick 1 of 3 hidden objects each day. Take photos outside to match the object."
export const howToPlayRulePick =
  "Pick 1 of 3 hidden objects. You get a hint, not the name. Everyone gets the same three."
export const howToPlayRulePhotos =
  "Take up to 6 photos on your pick. Each photo gets a closeness score, 0 to 100%. Higher means closer. You get a hint with each score."
export const howToPlayRuleScorerBefore =
  "80% or more finds it. Your photos stay on this device. The"
export const howToPlayRuleScorerAfter = "runs here, not on a server."
export const howToPlayRuleStuck =
  "Stuck? Tap Try another object? You get 6 new photos on a new pick. The old object stays dead for the day. The reveal names it."
export const howToPlayRuleShare = "Share your scores with friends. The reveal names every object."
export const startPlayingAction = "Start playing"
export const loadingScorerAction = "Loading the photo scorer"
export function loadingScorerPercent(fraction: number): string {
  return `Loading the photo scorer: ${Math.round(fraction * 100)}%`
}
export const scorerReadyNote = "The photo scorer is ready. Your photos stay on this device."
export const scorerLoadingNote =
  "The photo scorer checks your photos on this device. The app downloads it once."
export const scorerFailedTitle = "The photo scorer cannot load."
export const retryAction = "Retry"

/** Statistics dialog. */
export const statsTitle = "Statistics"
export const playedFact = "Played"
export const wonFact = "Won"
export const winPercentFact = "Win %"
export const streakFact = "Streak"
export const maxStreakFact = "Max"
export const histogramHeading = "Guesses to solve"
export const nextDayHeading = "NEXT DAY"

/** Scorer status card. */
export const scorerUnavailableTitle = "Photo scorer unavailable"
export const scorerFailedNote = "failed to load. Check your connection and retry."
export const scorerGettingReadyTitle = "Getting the photo scorer ready…"
export const scorerDownloadNote = "(once, then saved on this device)."

/** Notices. */
export const copyFailedNotice = "Copy failed. Long-press the card instead."
export function scoreFailedNotice(cause: string): string {
  return `Couldn't score that photo: ${cause}`
}

/** Scorer term explainer. */
export const scorerTerm = "photo scorer"
export const scorerTermTitle = "Photo scorer"
export const scorerTermExplainer =
  "Compares your photo to today's hidden object on this device, 0 to 100%."
