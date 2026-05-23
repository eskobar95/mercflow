import type { ReactNode } from "react"

/**
 * Badge — small status indicator.
 *
 * Variants:
 *   neutral  — generic label, slate background
 *   accent   — blue tint, used for "New", primary callouts
 *   success  — emerald, growth or completed state
 *   warning  — amber, attention needed
 *   danger   — red, failed/destructive
 *
 * Dot variant: render a tiny colored dot before the label. Mercury / Stripe
 * use this in dense lists where the badge fill would be too loud.
 */

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger"

type BadgeProps = {
  variant?: BadgeVariant
  /** Render as a dot + label instead of a filled pill. */
  dot?: boolean
  children: ReactNode
  className?: string
}

const fillMap: Record<BadgeVariant, string> = {
  neutral: "bg-surface-subtle text-content-secondary",
  accent:  "bg-accent-subtle text-accent-text",
  success: "bg-feedback-success-subtle text-feedback-success-content",
  warning: "bg-feedback-warning-subtle text-feedback-warning-content",
  danger:  "bg-feedback-danger-subtle text-feedback-danger-content",
}

const dotColorMap: Record<BadgeVariant, string> = {
  neutral: "bg-content-tertiary",
  accent:  "bg-accent",
  success: "bg-feedback-success-default",
  warning: "bg-feedback-warning-default",
  danger:  "bg-feedback-danger-default",
}

export function Badge({
  variant = "neutral",
  dot = false,
  children,
  className = "",
}: BadgeProps): JSX.Element {
  if (dot) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[12px] font-medium text-content-secondary ${className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotColorMap[variant]}`} aria-hidden />
        {children}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${fillMap[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
