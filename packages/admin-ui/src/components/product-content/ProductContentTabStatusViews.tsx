import type { ReactNode } from "react"

type ProductContentTabStatusViewsProps = {
  localesLoading: boolean
  loading: boolean
  bannerError: string | null
  contentIsNull: boolean
  onRetryLoad: () => void
}

export function renderProductContentTabStatus({
  localesLoading,
  loading,
  bannerError,
  contentIsNull,
  onRetryLoad,
}: ProductContentTabStatusViewsProps): ReactNode | null {
  if (localesLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <p className="text-sm text-content-secondary">Loading store locales…</p>
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

  return null
}
