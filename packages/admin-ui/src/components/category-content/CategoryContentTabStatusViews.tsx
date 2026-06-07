import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"

type CategoryContentTabStatusViewsProps = {
  localesLoading: boolean
  localesError: string | null
  loading: boolean
  bannerError: string | null
  contentIsNull: boolean
  readLocale: string
  saving: boolean
  onRetryLoad: () => void
  onAddContent: () => void
}

export function renderCategoryContentTabStatus({
  localesLoading,
  localesError,
  loading,
  bannerError,
  contentIsNull,
  readLocale,
  saving,
  onRetryLoad,
  onAddContent,
}: CategoryContentTabStatusViewsProps): ReactNode | null {
  if (localesLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <p className="text-sm text-content-secondary">Loading store locales…</p>
      </div>
    )
  }

  if (localesError !== null) {
    return (
      <div
        role="alert"
        className="rounded-md border border-border-strong bg-surface-subtle px-3 py-2 text-sm text-content-danger"
      >
        Could not load locales from Medusa ({localesError}). Fix your session or connection, then
        refresh.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <p className="text-sm text-content-secondary">Loading CMS content…</p>
      </div>
    )
  }

  if (bannerError !== null && contentIsNull) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-md border border-border-strong bg-surface-subtle px-3 py-2 text-sm text-content-danger"
        >
          {bannerError}
        </div>
        <button
          type="button"
          onClick={() => {
            void onRetryLoad()
          }}
          className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          Retry
        </button>
      </div>
    )
  }

  if (contentIsNull) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-content-secondary">No content yet.</p>
        <p className="text-xs text-content-tertiary">
          Create initial placeholders for TipTap rich text plus SEO metadata for locale{" "}
          <code className="text-xs">{readLocale}</code>. Saving uses{" "}
          <span className="font-mono text-xs">POST /admin/category-content</span>.
        </p>
        <div>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              void onAddContent()
            }}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add content"}
          </button>
        </div>
      </Card>
    )
  }

  return null
}
