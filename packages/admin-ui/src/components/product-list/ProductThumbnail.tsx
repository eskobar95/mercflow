import type { CSSProperties, ReactNode } from "react"

/**
 * Product thumbnail — image when `imageUrl` is set, otherwise a placeholder square with initials.
 *
 * Dynamic hue/size use CSS custom properties on a token-backed shell class.
 */
type ProductThumbnailProps = {
  title: string
  /** Optional URL from Medusa thumbnail or image pipeline. When missing, initials + hue are shown. */
  imageUrl?: string | null
  hue?: number
  size?: number
}

const imageShellClass =
  "inline-block shrink-0 overflow-hidden rounded-md bg-surface-subtle ring-1 ring-inset ring-border-default"

const placeholderShellClass =
  "inline-flex shrink-0 items-center justify-center rounded-md font-semibold tracking-tight shadow-[inset_0_0_0_1px_rgba(15,17,20,0.06)] [font-size:var(--thumb-fs)] [background:var(--thumb-bg)] [color:var(--thumb-fg)] [width:var(--thumb-size)] [height:var(--thumb-size)] [min-width:var(--thumb-size)]"

function thumbnailSizeStyle(size: number, hue: number): CSSProperties {
  return {
    ["--thumb-size" as string]: `${size}px`,
    ["--thumb-bg" as string]: `hsl(${hue} 38% 88%)`,
    ["--thumb-fg" as string]: `hsl(${hue} 42% 32%)`,
    ["--thumb-fs" as string]: `${size * 0.38}px`,
  } as CSSProperties
}

export function ProductThumbnail({
  title,
  imageUrl,
  hue = 200,
  size = 36,
}: ProductThumbnailProps): ReactNode {
  const initial = title.trim().charAt(0).toUpperCase()
  const dimensionStyle = { width: size, height: size, minWidth: size }

  if (typeof imageUrl === "string" && imageUrl.trim() !== "") {
    return (
      <span className={imageShellClass} style={dimensionStyle}>
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
      className={placeholderShellClass}
      style={thumbnailSizeStyle(size, hue)}
    >
      {initial}
    </span>
  )
}
