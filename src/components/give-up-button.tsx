import { useState } from "react"
import { Button } from "@/components/ui/button"

export interface GiveUpButtonProps {
  readonly label: string
  readonly onGiveUp: () => void
}

/**
 * Two-tap give-up: the first tap arms a confirm state, the second tap
 * kills the prompt for the day and resets its photos. The parent keys
 * on the choice id so arming resets whenever the pick changes.
 */
export function GiveUpButton({ label, onGiveUp }: GiveUpButtonProps) {
  const [armed, setArmed] = useState(false)
  if (!armed) {
    return (
      <Button aria-label={`Give up on ${label}`} onClick={() => setArmed(true)} variant="ghost">
        Give up on {label}
      </Button>
    )
  }
  return (
    <Button aria-label={`Confirm giving up on ${label}`} onClick={onGiveUp} variant="destructive">
      Confirm give up — photos reset
    </Button>
  )
}
