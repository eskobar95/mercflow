import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"

/**
 * Button — standard MercFlow primitive.
 *
 * Variants (Mercury / Stripe pattern):
 *   primary    — solid accent fill, the single "do this thing" affordance
 *   secondary  — white card with hairline border, neutral hover
 *   soft       — accent-tinted background, blue-text label
 *   ghost      — transparent until hover, lowest visual weight
 *   destructive— red soft fill, for delete/cancel actions
 *
 * Sizes:
 *   sm — 32px, used in dense rows
 *   md — 36px (default), used everywhere
 *   lg — 40px, used on mobile sticky bottom CTAs
 *
 * Motion (Emil):
 *   - All buttons get `active:scale-[0.97]` for press feedback
 *   - Color transitions are 150ms ease-out (custom curve)
 *   - Transform animations specify the exact property — never `transition: all`
 *
 * The base styles always emit a strong focus ring (accent blue 40% via
 * shadow.focus token) for accessibility.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "ghost"
  | "destructive"

export type ButtonSize = "sm" | "md" | "lg"

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
  children?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12px]",
  md: "h-9 px-3.5 text-[13px]",
  lg: "h-10 px-4 text-[14px]",
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-content-inverse shadow-sm hover:bg-accent-strong focus-visible:outline-accent",
  secondary:
    "border border-border-default bg-surface-appCard text-content-primary hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-accent",
  soft:
    "bg-accent-subtle text-accent-text hover:bg-accent-soft focus-visible:outline-accent",
  ghost:
    "text-content-secondary hover:bg-surface-subtle hover:text-content-primary focus-visible:outline-accent",
  destructive:
    "bg-feedback-danger-subtle text-feedback-danger-content hover:bg-feedback-danger-default hover:text-content-inverse focus-visible:outline-feedback-danger-default",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leadingIcon,
    trailingIcon,
    fullWidth,
    className = "",
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const composed = [
    // Base
    "group/btn inline-flex items-center justify-center gap-1.5 rounded-full font-semibold tracking-tight",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-150",
    "active:scale-[0.97]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
    sizeClass[size],
    variantClass[variant],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={composed}
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      {...rest}
    >
      {leadingIcon ? <span className="shrink-0">{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span className="shrink-0">{trailingIcon}</span> : null}
    </button>
  )
})
