import type { ReactNode } from "react"
export type SEOPreviewProps = {
  title: string
  description: string
  /** Shown when title is empty — e.g. product name */
  fallbackTitle?: string
}

/**
 * Lightweight search-snippet style preview (presentational only).
 */
export function SEOPreview({
  title,
  description,
  fallbackTitle = "Product",
}: SEOPreviewProps): ReactNode {
  const displayTitle = title.trim() !== "" ? title.trim() : fallbackTitle
  const displayDescription =
    description.trim() !== ""
      ? description.trim()
      : "Add a meta description to improve how this product appears in search results."

  return (
    <div
      className="rounded-md border border-border-default bg-surface-subtle p-4"
      aria-label="SEO preview"
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-content-tertiary">
        Search preview
      </p>
      <p className="line-clamp-1 text-base font-medium text-interactive-primary">
        {displayTitle}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-content-secondary">{displayDescription}</p>
    </div>
  )
}
