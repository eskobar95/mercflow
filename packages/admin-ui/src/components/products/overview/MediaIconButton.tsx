import type { ButtonHTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/cn"

type MediaIconButtonProps = {
  label: string
  active?: boolean
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">

/** Small overlay icon button used on media thumbnails (thumbnail/remove/reorder). */
export function MediaIconButton({
  label,
  active = false,
  className,
  children,
  ...rest
}: MediaIconButtonProps): ReactNode {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full border text-content-secondary",
        "bg-surface-raised/90 backdrop-blur transition-colors duration-150",
        active
          ? "border-interactive-primary text-interactive-primary"
          : "border-border-default hover:border-border-strong hover:text-content-primary",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
