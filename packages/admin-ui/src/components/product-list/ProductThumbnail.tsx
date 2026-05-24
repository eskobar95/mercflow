/**
 * Product thumbnail — 36×36px placeholder square with first-letter initial.
 * Replace `hue` + initials with a real <img> once media URLs are available.
 *
 * Inline HSL styles are an intentional exception: hue is per-row mock data and
 * cannot be expressed as static design tokens until a real avatar component exists.
 */
type ProductThumbnailProps = {
  title: string
  hue: number
  size?: number
}

export function ProductThumbnail({ title, hue, size = 36 }: ProductThumbnailProps): JSX.Element {
  const initial = title.trim().charAt(0).toUpperCase()
  const bg = `hsl(${hue} 38% 88%)`
  const color = `hsl(${hue} 42% 32%)`

  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: bg,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
        fontSize: size * 0.38,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {initial}
    </span>
  )
}
