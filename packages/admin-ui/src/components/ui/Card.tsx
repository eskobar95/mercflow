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
 * Card — MercFlow surface.
 *
 * Stripe settings panels use `elevation="flat"` (border only, no shadow).
 * Mercury marketing tiles use `elevation="resting"` or `"hover"`.
 */
export function Card({
  children,
  className = "",
  elevation = "resting",
  compact = false,
}: CardProps): ReactNode {
  // Depth is border-driven, not shadow-driven. `hover` adds a tiny lift + a
  // crisper hairline rather than a drop shadow (the "no shadow" house style).
  const elev =
    elevation === "flat"
      ? ""
      : elevation === "hover"
        ? "transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-border-strong"
        : ""

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
