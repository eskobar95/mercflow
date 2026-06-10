import type { ReactNode } from "react"

import { cn } from "@/lib/cn"

export type SEOPreviewProps = {
  title: string
  description: string
  /** Shown when title is empty — e.g. product name */
  fallbackTitle?: string
  /** When true, title text uses danger styling (Google snippet > 60 chars). */
  titleOverSnippetLimit?: boolean
  /** When true, description text uses danger styling (Google snippet > 160 chars). */
  descriptionOverSnippetLimit?: boolean
  /** Optional URL line above the title in the snippet preview. */
  previewUrl?: string
}

const DEFAULT_PREVIEW_URL = "example.com › products"

/**
 * Lightweight search-snippet style preview (presentational only).
 */
export function SEOPreview({
  title,
  description,
  fallbackTitle = "Product",
  titleOverSnippetLimit = false,
  descriptionOverSnippetLimit = false,
  previewUrl = DEFAULT_PREVIEW_URL,
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
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-content-tertiary">
        Search preview
      </p>
      <p className="line-clamp-1 text-xs text-content-secondary">{previewUrl}</p>
      <p
        className={cn(
          "line-clamp-1 text-base font-medium",
          titleOverSnippetLimit ? "text-feedback-danger" : "text-interactive-primary",
        )}
      >
        {displayTitle}
      </p>
      <p
        className={cn(
          "mt-1 line-clamp-2 text-sm",
          descriptionOverSnippetLimit ? "text-feedback-danger" : "text-content-secondary",
        )}
      >
        {displayDescription}
      </p>
    </div>
  )
}
