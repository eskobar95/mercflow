import { cn } from "@/lib/cn"

/**
 * MercFlow form surfaces — Stripe Dashboard reference (primary for controls).
 *
 * Stripe traits we adopt:
 * - Dense 36px controls, 6px radius, hairline borders — no field shadows.
 * - Labels: compact 13px medium; hints sit *below* the control.
 * - Dropdowns: single shadow-md float; selected/hover row uses accent tint.
 * - Section panels: border-only cards (no nested elevation).
 *
 * Mercury traits retained for page chrome (sidebar, marketing tiles).
 */

/** Field label — Stripe settings density (13px medium). */
export const formLabelClass =
  "text-sm font-medium leading-snug text-content-primary"

/** Hint / helper below a control. */
export const formHintClass = "text-xs leading-relaxed text-content-tertiary"

/** Error message below fields. */
export const formErrorClass = "text-xs text-feedback-danger-content"

const fieldTransition =
  "transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none"

/**
 * Focus for text fields — Stripe-style: accent border only, no outer glow.
 * WCAG 2.4.7: border contrast shift is the focus indicator.
 */
export const fieldFocusClass =
  "focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-none"

/** Focus for icon-only controls — subtle inset hairline, not a halo. */
const iconControlFocusClass =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong"

/** Focus for push buttons — thin offset outline (keyboard only). */
export const buttonFocusClass =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-accent/35"

/** Primary filled buttons — light outline reads on accent fill. */
export const buttonPrimaryFocusClass =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-content-inverse/70"

/**
 * Base field surface — Stripe flat input on white panels.
 */
const fieldBaseClass = cn(
  "w-full min-w-0 h-9 rounded-sm border bg-surface-default px-3 text-sm text-content-primary",
  "placeholder:text-content-tertiary",
  "hover:border-border-strong",
  fieldFocusClass,
  "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-content-disabled",
  fieldTransition,
)

export function fieldClassName(options?: {
  error?: boolean
  className?: string
}): string {
  return cn(
    fieldBaseClass,
    options?.error
      ? "border-feedback-danger focus-visible:border-feedback-danger focus-visible:shadow-none"
      : "border-border-default",
    options?.className,
  )
}

/** Compact icon control — toolbars, table actions (not full 44px chrome). */
export const toolbarIconButtonClass = cn(
  "inline-flex h-8 w-8 items-center justify-center rounded-sm",
  "text-content-secondary transition-[background-color,color,transform] duration-150",
  "hover:bg-surface-subtle hover:text-content-primary",
  iconControlFocusClass,
  "active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
  "motion-reduce:transition-none motion-reduce:active:scale-100",
)

/** Press feedback for icon-only controls with touch target (44px hit area). */
export const formIconButtonClass = cn(
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-base",
  "text-content-secondary transition-[background-color,color,transform] duration-150",
  "hover:bg-surface-subtle hover:text-content-primary",
  iconControlFocusClass,
  "active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
  "motion-reduce:transition-none motion-reduce:active:scale-100",
)

/**
 * Floating panel chrome — Linear-style menu surface. No hard border: the soft
 * shadow carries a faint 1px ring already, so a solid neutral border just
 * doubles the edge and reads heavy. Rely on elevation + tonal lift instead.
 */
export const overlayPanelClass = cn(
  "rounded-lg bg-surface-raised shadow-lg",
)

/** Highlight row inside select / menu lists. */
export const menuItemClass = cn(
  "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-content-primary outline-none",
  "min-h-8",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  "data-[highlighted]:bg-accent-subtle data-[highlighted]:text-content-primary",
  "data-[state=checked]:font-medium data-[state=checked]:text-accent-text",
)
