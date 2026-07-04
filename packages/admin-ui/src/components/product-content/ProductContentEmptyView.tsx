import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { ContentLocaleSwitcher } from "@/components/content-locale/ContentLocaleSwitcher"
import type { AdminLocale } from "@/features/content-locale"

type ProductContentEmptyViewProps = {
  locales: AdminLocale[]
  activeLocaleCode: string
  saving: boolean
  localesLoading: boolean
  localesWarning?: string | null
  onLocaleChange: (code: string) => void
  onAddContent: () => void
}

export function ProductContentEmptyView({
  locales,
  activeLocaleCode,
  saving,
  localesLoading,
  localesWarning = null,
  onLocaleChange,
  onAddContent,
}: ProductContentEmptyViewProps): ReactNode {
  return (
    <div className="space-y-4">
      {localesWarning !== null ? (
        <div
          role="status"
          className="rounded-md border border-border-strong bg-surface-subtle px-3 py-2 text-sm text-content-secondary"
        >
          Store languages could not be loaded ({localesWarning}). Editing continues with locale{" "}
          <code className="text-xs">{activeLocaleCode}</code>.
        </div>
      ) : null}
      <ContentLocaleSwitcher
        locales={locales}
        value={activeLocaleCode}
        onChange={onLocaleChange}
        disabled={saving}
        localesLoading={localesLoading}
      />
      <Card className="space-y-3">
        <p className="text-sm text-content-secondary">No content yet.</p>
        <p className="text-xs text-content-tertiary">
          Create initial placeholders for TipTap rich text plus SEO metadata for locale{" "}
          <code className="text-xs">{activeLocaleCode}</code>. Saving uses{" "}
          <span className="font-mono text-xs">POST /admin/product-content</span>.
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
    </div>
  )
}
