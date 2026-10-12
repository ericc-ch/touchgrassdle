import { useState } from "react"
import { Button } from "@/components/ui/button"

export interface GiveUpButtonProps {
  readonly onGiveUp: () => void
}

/**
 * Two-tap object switch for the day header. The idle tap invites another
 * pick. The armed tap confirms the cost without naming the object: names
 * stay hidden until the reveal. The parent keys on the choice id so
 * arming resets whenever the pick changes.
 */
export function GiveUpButton({ onGiveUp }: GiveUpButtonProps) {
  const [armed, setArmed] = useState(false)
  if (!armed) {
    return (
      <Button
        aria-label="Try another object?"
        className="font-medium underline"
        onClick={() => setArmed(true)}
        variant="link"
      >
        Try another object?
      </Button>
    )
  }
  return (
    <Button
      aria-label="Tap again to confirm. Photos reset."
      className="font-medium text-destructive underline"
      onClick={onGiveUp}
      variant="link"
    >
      Tap again to confirm
    </Button>
  )
}
