import type { ReactNode } from "react"

type CardProps = {
  children: ReactNode
  className?: string
  /** Visual emphasis level. `flat` = no shadow, used inside other cards. */
  elevation?: "flat" | "resting" | "hover"
  /** Compact padding (16px) instead of standard (24px). */
  compact?: boolean
}

/**
 * Card — standard MercFlow surface (Mercury card geometry).
 *
 *   - 10px radius (radii.md)
 *   - hairline border + soft slate shadow (whisper-soft, never AI-drop-shadow)
 *   - white background, sits on the cool gray canvas
 *
 * Use `elevation="hover"` when the entire card is a link — adds the lift
 * transition Emil recommends.
 */
export function Card({
  children,
  className = "",
  elevation = "resting",
  compact = false,
}: CardProps): JSX.Element {
  const elev =
    elevation === "flat"
      ? ""
      : elevation === "hover"
        ? "shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md"
        : "shadow-sm"

  const pad = compact ? "p-4" : "p-6"

  const composed = [
    "rounded-md border border-border-default bg-surface-appCard",
    pad,
    elev,
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  return (
    <div
      className={composed}
      style={
        elevation === "hover"
          ? { transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }
          : undefined
      }
    >
      {children}
    </div>
  )
}
