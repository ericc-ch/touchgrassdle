import { useRef } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface CaptureButtonProps {
  readonly disabled: boolean
  readonly scoring: boolean
  readonly remaining: number
  readonly onFile: (file: File) => void
}

/**
 * Photo capture. Uses the camera sheet on touch devices, the file
 * picker on desktop (hybrid per plan: friction where it works).
 */
export function CaptureButton({ disabled, scoring, remaining, onFile }: CaptureButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const coarse =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches

  return (
    <>
      <Button
        disabled={disabled || scoring}
        onClick={() => inputRef.current?.click()}
        size="lg"
        className="w-full"
      >
        <Camera />
        {scoring ? "Scoring…" : disabled ? "No shots left" : `Shoot (${remaining} left)`}
      </Button>
      <input
        accept="image/*"
        capture={coarse ? "environment" : undefined}
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
    </>
  )
}
