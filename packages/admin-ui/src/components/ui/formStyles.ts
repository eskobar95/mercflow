import { cn } from "@/lib/cn"

/** Shared label styling — Mercury / Stripe compact hierarchy. */
export const formLabelClass =
  "text-sm font-medium text-content-primary"

/** Hint text below labels. */
export const formHintClass = "text-xs text-content-tertiary"

/** Error message below fields. */
export const formErrorClass = "text-sm text-feedback-danger-content"

/** Press feedback for icon-only controls in form toolbars. */
export const formIconButtonClass = cn(
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md",
  "text-content-secondary transition-[background-color,color,transform] duration-150",
  "hover:bg-surface-subtle hover:text-content-primary",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
  "active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
  "motion-reduce:transition-none motion-reduce:active:scale-100",
)

const fieldTransition =
  "transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none"

/** Base field surface — shadcn / Stripe hairline inputs on white cards. */
export const fieldBaseClass = cn(
  "w-full min-w-0 rounded-md border bg-surface-default px-3 py-2 text-sm text-content-primary shadow-sm",
  "placeholder:text-content-tertiary",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
  "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-content-disabled",
  fieldTransition,
)

export function fieldClassName(options?: {
  error?: boolean
  className?: string
}): string {
  return cn(
    fieldBaseClass,
    options?.error
      ? "border-feedback-danger focus-visible:outline-feedback-danger"
      : "border-border-default",
    options?.className,
  )
}
