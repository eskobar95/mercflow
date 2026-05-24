import { IconClose } from "@/components/ui/icons"
import { cn } from "@/lib/cn"

import { formIconButtonClass } from "./formStyles"

type TagProps = {
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}

/**
 * Dismissible chip — filters, selected values, compact metadata.
 */
export function Tag({ children, onDismiss, className }: TagProps): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex min-h-11 max-w-full items-center gap-1 rounded-full border border-border-default bg-surface-subtle px-3 py-1 text-xs font-medium text-content-primary",
        className,
      )}
    >
      <span className="truncate">{children}</span>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Remove tag"
          onClick={onDismiss}
          className={cn(formIconButtonClass, "min-h-8 min-w-8 rounded-full")}
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          <IconClose size={12} />
        </button>
      ) : null}
    </span>
  )
}
