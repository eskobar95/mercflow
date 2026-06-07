import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"

import {
  buttonFocusClass,
  buttonPrimaryFocusClass,
} from "@/components/ui/formStyles"
import { cn } from "@/lib/cn"

/**
 * IconButton — circular icon-only control for app chrome (TopBar, sidebar).
 *
 * Linear keeps chrome actions as round, label-less buttons with tooltips so the
 * bar stays quiet and scannable. `label` is required: it is both the accessible
 * name and the native tooltip, so an icon never ships without a name.
 *
 * Variants:
 *   primary — filled ink circle (the one create/confirm action)
 *   ghost   — transparent, tints on hover (secondary chrome)
 *   outline — hairline ring on card surface (standalone affordances)
 */

type IconButtonVariant = "primary" | "ghost" | "outline"
type IconButtonSize = "sm" | "md"

type IconButtonProps = {
  variant?: IconButtonVariant
  size?: IconButtonSize
  /** Accessible name + tooltip. Required for every icon-only button. */
  label: string
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">

const sizeClass: Record<IconButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
}

const variantClass: Record<IconButtonVariant, string> = {
  primary: cn(
    "bg-interactive-primary text-content-inverse hover:bg-interactive-primary-hover active:bg-interactive-primary-pressed",
    buttonPrimaryFocusClass,
  ),
  ghost: cn(
    "text-content-secondary hover:bg-surface-subtle hover:text-content-primary",
    buttonFocusClass,
  ),
  outline: cn(
    "border border-border-default bg-surface-appCard text-content-secondary hover:border-border-strong hover:text-content-primary",
    buttonFocusClass,
  ),
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { variant = "ghost", size = "md", label, className, children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full",
          "transition-[background-color,color,border-color,transform] duration-150",
          "active:scale-[0.94] motion-reduce:transition-none motion-reduce:active:scale-100",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
          sizeClass[size],
          variantClass[variant],
          className,
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
