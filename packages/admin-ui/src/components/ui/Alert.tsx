import type { ReactNode } from "react"

import { cn } from "@/lib/cn"

export type AlertVariant = "info" | "success" | "warning" | "danger"

type AlertProps = {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  className?: string
}

const variantClass: Record<AlertVariant, string> = {
  info: "border-border-default bg-surface-subtle text-content-primary",
  success: "border-feedback-success-border bg-feedback-success-subtle text-feedback-success-content",
  warning: "border-feedback-warning-border bg-feedback-warning-subtle text-feedback-warning-content",
  danger: "border-feedback-danger-border bg-feedback-danger-subtle text-feedback-danger-content",
}

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: AlertProps): JSX.Element {
  return (
    <div
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variantClass[variant],
        className,
      )}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  )
}

/** Full-width banner variant for page-level notices. */
export function Banner(props: AlertProps): JSX.Element {
  return (
    <Alert
      {...props}
      className={cn("rounded-none border-x-0", props.className)}
    />
  )
}
