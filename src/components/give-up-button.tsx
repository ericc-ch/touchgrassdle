import { useState } from "react"
import { Button } from "@/components/ui/button"

export interface GiveUpButtonProps {
  readonly label: string
  readonly onGiveUp: () => void
}

/**
 * Two-tap subject switch: the idle tap invites another pick, the armed
 * tap names the cost (this subject dies, its photos reset). The parent
 * keys on the choice id so arming resets whenever the pick changes.
 */
export function GiveUpButton({ label, onGiveUp }: GiveUpButtonProps) {
  const [armed, setArmed] = useState(false)
  if (!armed) {
    return (
      <Button aria-label="Try another subject?" onClick={() => setArmed(true)} variant="ghost">
        Try another subject?
      </Button>
    )
  }
  return (
    <Button
      aria-label={`Confirm: end ${label} and reset photos`}
      onClick={onGiveUp}
      variant="destructive"
    >
      End {label} — photos reset
    </Button>
  )
}
