/**
 * Product thumbnail — image when `imageUrl` is set, otherwise a placeholder square with initials.
 *
 * Inline HSL styles are intentional for the initials fallback (`hue`-driven). Real images use
 * token-backed borders/radius instead.
 */
type ProductThumbnailProps = {
  title: string
  /** Optional URL from Medusa thumbnail or image pipeline. When missing, initials + hue are shown. */
  imageUrl?: string | null
  hue?: number
  size?: number
}

export function ProductThumbnail({
  title,
  imageUrl,
  hue = 200,
  size = 36,
}: ProductThumbnailProps): JSX.Element {
  const initial = title.trim().charAt(0).toUpperCase()
  const bg = `hsl(${hue} 38% 88%)`
  const color = `hsl(${hue} 42% 32%)`

  if (typeof imageUrl === "string" && imageUrl.trim() !== "") {
    return (
      <span
        className="inline-block shrink-0 overflow-hidden rounded-sm border border-border-default bg-surface-subtle"
        style={{ width: size, height: size, minWidth: size }}
      >
        <img
          alt=""
          src={imageUrl}
          loading="lazy"
          className="h-full w-full object-cover"
          width={size}
          height={size}
        />
      </span>
    )
  }

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
