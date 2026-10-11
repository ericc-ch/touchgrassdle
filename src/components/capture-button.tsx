import { useRef } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface CaptureButtonProps {
  readonly disabled: boolean
  readonly waiting: boolean
  readonly scoring: boolean
  readonly remaining: number
  readonly onFile: (file: File) => void
}

/**
 * One button over a hidden file input. Mobile browsers show their native
 * sheet (camera or gallery) because the input has no `capture` attribute;
 * desktop opens the file picker. Nothing else happens in the page.
 */
export function CaptureButton({
  disabled,
  waiting,
  scoring,
  remaining,
  onFile,
}: CaptureButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const busy = disabled || waiting || scoring
  const actionLabel = scoring
    ? "Checking photo…"
    : disabled
      ? "No photos left"
      : waiting
        ? "Loading the photo scorer…"
        : `Take photo (${remaining} left)`

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        className="w-full"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        size="lg"
      >
        <Camera data-icon="inline-start" />
        {actionLabel}
      </Button>
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file !== undefined) {
            onFile(file)
          }
        }}
        ref={inputRef}
        type="file"
      />
    </div>
  )
}
