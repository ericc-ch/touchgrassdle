import { useRef, useState } from "react"
import { Camera, ImagePlus, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface CaptureButtonProps {
  readonly disabled: boolean
  readonly scoring: boolean
  readonly remaining: number
  readonly onFile: (file: File) => void
}

function stopStream(stream: MediaStream | null): void {
  if (stream !== null) {
    for (const track of stream.getTracks()) {
      track.stop()
    }
  }
}

function cameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function"
  )
}

/**
 * Photo capture with live camera preview and an upload fallback.
 * No effects: the camera only starts from the Enable button (user gesture),
 * and tracks stop from Take/Close handlers or when the last photo is used.
 */
export function CaptureButton({ disabled, scoring, remaining, onFile }: CaptureButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const previewOn = stream !== null
  const busy = disabled || scoring

  const startPreview = (): void => {
    if (!cameraSupported() || busy) {
      inputRef.current?.click()
      return
    }
    setStarting(true)
    setPreviewError(null)
    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(
        (next) => {
          setStream(next)
          setStarting(false)
        },
        () => {
          setStarting(false)
          setPreviewError("Camera blocked — upload a photo instead.")
          inputRef.current?.click()
        },
      )
  }

  const closePreview = (): void => {
    stopStream(stream)
    setStream(null)
    if (videoRef.current !== null) {
      videoRef.current.srcObject = null
    }
  }

  const takePhoto = (): void => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video === null || canvas === null || busy) {
      return
    }
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 960
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (ctx === null) {
      inputRef.current?.click()
      return
    }
    ctx.drawImage(video, 0, 0, width, height)
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          inputRef.current?.click()
          return
        }
        onFile(new File([blob], "photo.jpg", { type: "image/jpeg" }))
        if (remaining <= 1) {
          closePreview()
        }
      },
      "image/jpeg",
      0.92,
    )
  }

  const pickUpload = (): void => {
    inputRef.current?.click()
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {previewOn ? (
        <>
          <video
            aria-label="Live camera preview"
            autoPlay
            className="aspect-[4/3] w-full bg-black object-cover"
            muted
            playsInline
            ref={(element) => {
              videoRef.current = element
              if (element !== null && stream !== null) {
                element.srcObject = stream
              }
            }}
          />
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={takePhoto} size="lg">
              <Camera data-icon="inline-start" />
              {scoring ? "Checking photo…" : `Take photo (${remaining} left)`}
            </Button>
            <Button
              aria-label="Close camera preview"
              onClick={closePreview}
              size="icon"
              variant="outline"
            >
              <VideoOff />
            </Button>
          </div>
          <Button disabled={busy} onClick={pickUpload} variant="ghost">
            <ImagePlus data-icon="inline-start" />
            Upload instead
          </Button>
        </>
      ) : (
        <>
          <Button className="w-full" disabled={busy || starting} onClick={startPreview} size="lg">
            <Camera data-icon="inline-start" />
            {scoring
              ? "Checking photo…"
              : disabled
                ? "No photos left"
                : starting
                  ? "Starting camera…"
                  : `Take photo (${remaining} left)`}
          </Button>
          <Button disabled={busy} onClick={pickUpload} variant="ghost">
            <ImagePlus data-icon="inline-start" />
            Upload a photo instead
          </Button>
        </>
      )}
      {previewError !== null ? (
        <p className="text-center text-xs text-muted-foreground">{previewError}</p>
      ) : null}
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
      <canvas aria-hidden="true" className="hidden" ref={canvasRef} />
    </div>
  )
}
