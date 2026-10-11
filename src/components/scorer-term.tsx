import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * The photo-scorer term with its explainer. Hover, keyboard focus, or tap
 * opens it (native `title` tooltips never fire on touch screens).
 * `closeOnClick` is off because tap-to-focus is how touch opens it — the
 * default would cancel the pending open on pointer-down. Tap elsewhere (or
 * Escape) closes it via blur.
 */
export function ScorerTerm() {
  return (
    <Tooltip>
      <TooltipTrigger
        closeOnClick={false}
        render={<span className="underline decoration-dotted underline-offset-4" tabIndex={0} />}
      >
        photo scorer
      </TooltipTrigger>
      <TooltipContent>
        <p>Compares your photo to today&apos;s hidden subject on this device, 0 to 100%.</p>
      </TooltipContent>
    </Tooltip>
  )
}
