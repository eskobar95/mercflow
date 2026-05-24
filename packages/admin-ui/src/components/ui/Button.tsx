import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"

import {
  buttonFocusClass,
  buttonPrimaryFocusClass,
} from "@/components/ui/formStyles"
import { cn } from "@/lib/cn"

/**
 * Button — MercFlow primitive.
 *
 * Shapes (intentional split):
 *   default — rounded-sm (6px). Forms, lists, settings — Stripe density.
 *   pill    — rounded-full. Global chrome only (TopBar Create, marketing CTAs).
 *
 * Variants:
 *   primary / secondary / soft / ghost / destructive
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "ghost"
  | "destructive"

export type ButtonSize = "sm" | "md" | "lg"
export type ButtonShape = "default" | "pill"

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
  children?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-10 px-4 text-base",
}

const shapeClass: Record<ButtonShape, string> = {
  default: "rounded-sm",
  pill: "rounded-full",
}

const variantClass: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-accent text-content-inverse hover:bg-accent-strong",
    buttonPrimaryFocusClass,
  ),
  secondary: cn(
    "border border-border-default bg-surface-appCard text-content-primary hover:border-border-strong hover:bg-surface-subtle",
    buttonFocusClass,
  ),
  soft: cn(
    "bg-accent-subtle text-accent-text hover:bg-accent-soft",
    buttonFocusClass,
  ),
  ghost: cn(
    "text-content-secondary hover:bg-surface-subtle hover:text-content-primary",
    buttonFocusClass,
  ),
  destructive: cn(
    "bg-feedback-danger-subtle text-feedback-danger-content hover:bg-feedback-danger hover:text-content-inverse focus-visible:outline-feedback-danger/40",
    buttonFocusClass,
  ),
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    shape = "default",
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
  const composed = cn(
    "group/btn inline-flex items-center justify-center gap-1.5 font-medium tracking-tight",
    "transition-[background-color,color,border-color,transform] duration-150",
    "active:scale-[0.97]",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
    sizeClass[size],
    shapeClass[shape],
    variantClass[variant],
    fullWidth ? "w-full" : "",
    className,
  )

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
