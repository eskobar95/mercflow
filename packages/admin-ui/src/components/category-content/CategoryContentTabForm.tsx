import type { JSONContent } from "@tiptap/core"
import type { Dispatch, ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import type { CategoryContentReadPayload } from "@/features/category-content/types"

import { ProductDescriptionEditor } from "../product-content/ProductDescriptionEditor"

import type { CategoryContentFormAction } from "./categoryContentFormState"
import { localeBadgeLabel } from "./categoryContentFormState"
import { CategoryContentImagesSection } from "./CategoryContentImagesSection"
import { CategoryContentSeoSection } from "./CategoryContentSeoSection"

type CategoryContentTabFormProps = {
  formId: string
  content: CategoryContentReadPayload
  saving: boolean
  disabled: boolean
  bannerError: string | null
  descriptionJson: JSONContent
  seoTitle: string
  seoDescription: string
  ogUrl: string
  bannerUrl: string
  seoTitleTooLong: boolean
  seoDescriptionTooLong: boolean
  isDirty: boolean
  seoPreviewTitle: string
  categoryTitleFallback: string
  runSave: () => Promise<boolean>
  onDiscard: () => Promise<void>
  dispatchForm: Dispatch<CategoryContentFormAction>
}

export function CategoryContentTabForm({
  formId,
  content,
  saving,
  disabled,
  bannerError,
  descriptionJson,
  seoTitle,
  seoDescription,
  ogUrl,
  bannerUrl,
  seoTitleTooLong,
  seoDescriptionTooLong,
  isDirty,
  seoPreviewTitle,
  categoryTitleFallback,
  runSave,
  onDiscard,
  dispatchForm,
}: CategoryContentTabFormProps): ReactNode {
  return (
    <div className="space-y-6">
      <div aria-live="polite" className="sr-only">
        {saving ? "Saving category content." : ""}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-content-primary">Locale</span>
        <Badge variant="neutral" aria-label={`CMS content locale ${content.locale}`}>
          {localeBadgeLabel(content.locale)}
        </Badge>
        <span className="text-xs text-content-tertiary">
          Store languages come from{" "}
          <code className="text-xs rounded bg-surface-subtle px-1">GET /admin/locales</code> —
          Danish is preferred when available; switching per locale arrives in Sprint 4.
        </span>
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
              <span className="font-mono text-xs">PATCH /admin/category-content/</span>
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

        <CategoryContentSeoSection
          formId={formId}
          seoTitle={seoTitle}
          seoDescription={seoDescription}
          seoTitleTooLong={seoTitleTooLong}
          seoDescriptionTooLong={seoDescriptionTooLong}
          disabled={disabled}
          seoPreviewTitle={seoPreviewTitle}
          categoryTitleFallback={categoryTitleFallback}
          dispatchForm={dispatchForm}
        />

        <CategoryContentImagesSection
          formId={formId}
          ogUrl={ogUrl}
          bannerUrl={bannerUrl}
          disabled={disabled}
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
    </div>
  )
}
