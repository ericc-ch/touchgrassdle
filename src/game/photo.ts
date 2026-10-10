/** Largest thumbnail edge in pixels. Keeps localStorage small. */
export const THUMBNAIL_EDGE = 640

/**
 * Downscale a photo file to a JPEG thumbnail data URL.
 * Respects EXIF orientation so camera photos come out upright.
 */
export async function fileToThumbnail(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  try {
    const scale = Math.min(1, THUMBNAIL_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext("2d")
    if (ctx === null) {
      throw new Error("2d canvas unavailable")
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.82)
  } finally {
    bitmap.close()
  }
}
