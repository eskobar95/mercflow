import type { ReactNode } from "react"

type ListEmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
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
  className = "",
}: ListEmptyStateProps): JSX.Element {
  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-subtle bg-surface-subtle px-6 py-12 text-center ${className}`.trim()}
      role="status"
    >
      <p className="text-base font-medium text-content-primary">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-content-secondary">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}
