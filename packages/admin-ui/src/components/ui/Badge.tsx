import type { ComponentPropsWithoutRef, ReactNode } from "react"

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
 *
 * WCAG AA: text/background pairs use design-token values verified in batch1
 * (primary on white ≥ 14:1, accent-text on accent-subtle, feedback-* pairs).
 */

type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger"

type BadgeNativeProps = Omit<ComponentPropsWithoutRef<"span">, "children">

type BadgeProps = BadgeNativeProps & {
  variant?: BadgeVariant
  /** Render as a dot + label instead of a filled pill. */
  dot?: boolean
  children: ReactNode
}

// Each pill carries a hairline ring so it stays crisp on flat (shadow-less)
// surfaces — the inset 1px reads as a border without adding layout width.
const fillMap: Record<BadgeVariant, string> = {
  neutral: "bg-surface-subtle text-content-secondary ring-1 ring-inset ring-border-default",
  accent: "bg-accent-subtle text-accent-text ring-1 ring-inset ring-accent-soft",
  success:
    "bg-feedback-success-subtle text-feedback-success-content ring-1 ring-inset ring-feedback-success-border",
  warning:
    "bg-feedback-warning-subtle text-feedback-warning-content ring-1 ring-inset ring-feedback-warning-border",
  danger:
    "bg-feedback-danger-subtle text-feedback-danger-content ring-1 ring-inset ring-feedback-danger-border",
}

const dotColorMap: Record<BadgeVariant, string> = {
  neutral: "bg-content-tertiary",
  accent: "bg-accent",
  success: "bg-feedback-success",
  warning: "bg-feedback-warning",
  danger: "bg-feedback-danger",
}

export function Badge({
  variant = "neutral",
  dot = false,
  children,
  className = "",
  ...rest
}: BadgeProps): ReactNode {
  if (dot) {
    return (
      <span
        {...rest}
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-content-secondary ${className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotColorMap[variant]}`} aria-hidden />
        {children}
      </span>
    )
  }

  return (
    <span
      {...rest}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${fillMap[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
