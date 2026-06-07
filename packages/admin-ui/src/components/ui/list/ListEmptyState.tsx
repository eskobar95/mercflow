import type { ReactNode } from "react"

type ListEmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  /**
   * Bare: drop the dashed panel chrome (border + tonal fill) and stretch to the
   * available height. Use inside a full-bleed list so the empty state reads as a
   * centered message on the page surface (Linear), not a boxed card.
   */
  bare?: boolean
  /** Renders inside a padded region; use for full table body replacement. */
  className?: string
}

/**
 * List area when there are no rows. Prefer title + body + optional CTA.
 */
export function ListEmptyState({
  title,
  description,
  action,
  bare = false,
  className = "",
}: ListEmptyStateProps): ReactNode {
  const chrome = bare
    ? "h-full px-6 py-12"
    : "min-h-48 rounded-lg border border-dashed border-border-subtle bg-surface-subtle px-6 py-12"
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-center ${chrome} ${className}`.trim()}
    >
      <p className="text-base font-medium text-content-primary">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-content-secondary">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}
