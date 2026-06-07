import type { ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { ContentLocaleSwitcher } from "@/components/content-locale/ContentLocaleSwitcher"
import { ContentLocaleUnsavedDialog } from "@/components/content-locale/ContentLocaleUnsavedDialog"
import type { AdminLocale } from "@/features/content-locale"

type ProductContentEmptyViewProps = {
  locales: AdminLocale[]
  activeLocaleCode: string
  saving: boolean
  localesLoading: boolean
  localeDialogOpen: boolean
  onLocaleDialogOpenChange: (open: boolean) => void
  requestLocaleChange: (code: string) => void
  onAddContent: () => void
  onSaveAndSwitchLocale: () => Promise<void>
  onDiscardAndSwitchLocale: () => Promise<void>
  closeLocaleDialog: () => void
}

export function ProductContentEmptyView({
  locales,
  activeLocaleCode,
  saving,
  localesLoading,
  localeDialogOpen,
  onLocaleDialogOpenChange,
  requestLocaleChange,
  onAddContent,
  onSaveAndSwitchLocale,
  onDiscardAndSwitchLocale,
  closeLocaleDialog,
}: ProductContentEmptyViewProps): ReactNode {
  return (
    <div className="space-y-4">
      <ContentLocaleSwitcher
        locales={locales}
        value={activeLocaleCode}
        onChange={requestLocaleChange}
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
      <ContentLocaleUnsavedDialog
        open={localeDialogOpen}
        onOpenChange={onLocaleDialogOpenChange}
        actionDisabled={saving}
        onSave={() => {
          void onSaveAndSwitchLocale()
        }}
        onDiscard={() => {
          void onDiscardAndSwitchLocale()
        }}
        onClose={closeLocaleDialog}
      />
    </div>
  )
}
