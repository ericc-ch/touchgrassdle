import { useState } from "react"
import { Button } from "@/components/ui/button"
import { switchConfirmAction, switchConfirmHint, switchIdleLabel } from "@/copy.ts"

export interface GiveUpButtonProps {
  readonly disabled: boolean
  readonly position: number
  readonly total: number
  readonly onGiveUp: () => void
}

/**
 * Two-tap object switch for the day header. The idle tap invites another
 * pick. The armed tap confirms the cost without naming the object: names
 * stay hidden until the reveal. The parent keys on the choice id so
 * arming resets whenever the pick changes. A disabled switch always
 * shows idle.
 */
export function GiveUpButton({ disabled, position, total, onGiveUp }: GiveUpButtonProps) {
  const [armed, setArmed] = useState(false)
  if (!armed || disabled) {
    return (
      <Button
        aria-label={switchIdleLabel(position, total)}
        className="font-medium underline"
        disabled={disabled}
        onClick={() => setArmed(true)}
        variant="link"
      >
        {switchIdleLabel(position, total)}
      </Button>
    )
  }
  return (
    <Button
      aria-label={switchConfirmHint}
      className="font-medium text-destructive underline"
      onClick={onGiveUp}
      variant="link"
    >
      {switchConfirmAction}
    </Button>
  )
}
