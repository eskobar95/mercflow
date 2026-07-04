import type { JSONContent } from "@tiptap/core"
import type { Dispatch, ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { ContentLocaleSwitcher } from "@/components/content-locale/ContentLocaleSwitcher"
import { ContentLocaleUnsavedDialog } from "@/components/content-locale/ContentLocaleUnsavedDialog"
import type { AdminLocale } from "@/features/content-locale"
import type { ProductContentReadPayload } from "@/features/product-content/types"

import type { ProductContentFormAction } from "./productContentFormState"
import { ProductContentSeoSection } from "./ProductContentSeoSection"
import { ProductDescriptionEditor } from "./ProductDescriptionEditor"

type ProductContentTabFormProps = {
  formId: string
  content: ProductContentReadPayload
  locales: AdminLocale[]
  activeLocaleCode: string
  localesLoading: boolean
  localesWarning?: string | null
  saving: boolean
  disabled: boolean
  bannerError: string | null
  descriptionJson: JSONContent
  seoTitle: string
  seoDescription: string
  ogUrl: string
  canonicalUrl: string
  seoTitleTooLong: boolean
  seoDescriptionTooLong: boolean
  isDirty: boolean
  seoPreviewTitle: string
  productTitleFallback: string
  localeDialogOpen: boolean
  onLocaleDialogOpenChange: (open: boolean) => void
  requestLocaleChange: (code: string) => void
  runSave: () => Promise<boolean>
  onDiscard: () => Promise<void>
  onSaveAndSwitchLocale: () => Promise<void>
  onDiscardAndSwitchLocale: () => Promise<void>
  closeLocaleDialog: () => void
  dispatchForm: Dispatch<ProductContentFormAction>
}

export function ProductContentTabForm({
  formId,
  content,
  locales,
  activeLocaleCode,
  localesLoading,
  localesWarning = null,
  saving,
  disabled,
  bannerError,
  descriptionJson,
  seoTitle,
  seoDescription,
  ogUrl,
  canonicalUrl,
  seoTitleTooLong,
  seoDescriptionTooLong,
  isDirty,
  seoPreviewTitle,
  productTitleFallback,
  localeDialogOpen,
  onLocaleDialogOpenChange,
  requestLocaleChange,
  runSave,
  onDiscard,
  onSaveAndSwitchLocale,
  onDiscardAndSwitchLocale,
  closeLocaleDialog,
  dispatchForm,
}: ProductContentTabFormProps): ReactNode {
  return (
    <div className="space-y-6">
      <div aria-live="polite" className="sr-only">
        {saving ? "Saving product content." : ""}
      </div>

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
        onChange={requestLocaleChange}
        disabled={disabled}
        localesLoading={localesLoading}
        resolvedContentLocale={content.locale ?? null}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span
          className="ml-auto text-xs tabular-nums text-content-tertiary"
          aria-label={`Content save version ${content.version}`}
        >
          Version <strong className="font-medium">{content.version}</strong>
          {disabled ? "" : ". Each save increments the counter."}
        </span>
      </div>

      {bannerError !== null ? (
        <div
          role="alert"
          className="rounded-md border border-border-strong bg-surface-subtle px-3 py-2 text-sm text-content-danger"
        >
          {bannerError}
        </div>
      ) : null}

      <form
        id={formId}
        className="space-y-6"
        onSubmit={(e): void => {
          e.preventDefault()
          void runSave()
        }}
      >
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-content-primary">Rich text description</h2>
            <p className="mt-1 text-sm text-content-secondary">
              Stored as TipTap JSON (<span className="font-mono text-xs">body_json</span> on reads).
              Further saves use{" "}
              <span className="font-mono text-xs">PATCH /admin/product-content/</span>
              {content.id}.
            </p>
          </div>
          <ProductDescriptionEditor
            value={descriptionJson}
            onChange={(value) => {
              dispatchForm({ type: "setDescriptionJson", value })
            }}
            variant="embedded"
            disabled={disabled}
          />
        </Card>

        <ProductContentSeoSection
          formId={formId}
          seoTitle={seoTitle}
          seoDescription={seoDescription}
          ogUrl={ogUrl}
          canonicalUrl={canonicalUrl}
          seoTitleTooLong={seoTitleTooLong}
          seoDescriptionTooLong={seoDescriptionTooLong}
          disabled={disabled}
          seoPreviewTitle={seoPreviewTitle}
          productTitleFallback={productTitleFallback}
          dispatchForm={dispatchForm}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled || seoTitleTooLong || seoDescriptionTooLong}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save content"}
          </button>
          <button
            type="button"
            disabled={disabled || !isDirty}
            onClick={() => {
              void onDiscard()
            }}
            className="rounded-md border border-border-default bg-surface-default px-4 py-2 text-sm font-medium text-content-primary shadow-sm hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          >
            Discard changes
          </button>
        </div>
      </form>

      <ContentLocaleUnsavedDialog
        open={localeDialogOpen}
        onOpenChange={onLocaleDialogOpenChange}
        actionDisabled={disabled}
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
