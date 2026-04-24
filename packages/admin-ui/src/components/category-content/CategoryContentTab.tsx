import type { JSONContent } from "@tiptap/core"
import { useCallback, useEffect, useId, useState } from "react"

import { ProductDescriptionEditor } from "@/components/product-content/ProductDescriptionEditor"
import { SEOPreview } from "@/components/product-content/SEOPreview"
import {
  EMPTY_TIPTAP_DOC,
  tiptapDocFromUnknown,
} from "@/components/product-content/tiptapDoc"
import { Card } from "@/components/ui/Card"
import { useCategoryContentState } from "@/features/category-content"

const SEO_DESCRIPTION_MAX = 160

export type CategoryContentTabProps = {
  categoryId: string
  /** Used in SEO preview when meta title is empty */
  categoryTitleFallback: string
}

export function CategoryContentTab({
  categoryId,
  categoryTitleFallback,
}: CategoryContentTabProps): JSX.Element {
  const formId = useId()
  const { content, loading, saving, error, save, load, clearError } =
    useCategoryContentState({
      categoryId,
    })

  const [descriptionJson, setDescriptionJson] = useState<JSONContent>(EMPTY_TIPTAP_DOC)
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [ogImageId, setOgImageId] = useState("")
  const [bannerImageId, setBannerImageId] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) {
      return
    }
    setDescriptionJson(tiptapDocFromUnknown(content?.description_rich))
    setSeoTitle(content?.seo_title ?? "")
    setSeoDescription(content?.seo_description ?? "")
    setOgImageId(content?.seo_og_image_id ?? "")
    setBannerImageId(content?.banner_image_id ?? "")
    setValidationError(null)
  }, [loading, content])

  const onSave = useCallback(async () => {
    clearError()
    if (seoDescription.length > SEO_DESCRIPTION_MAX) {
      setValidationError(
        `SEO description must be at most ${SEO_DESCRIPTION_MAX} characters (currently ${seoDescription.length}).`
      )
      return
    }
    setValidationError(null)
    await save({
      description_rich: descriptionJson,
      seo_title: seoTitle.trim() === "" ? null : seoTitle.trim(),
      seo_description: seoDescription.trim() === "" ? null : seoDescription.trim(),
      seo_og_image_id: ogImageId.trim() === "" ? null : ogImageId.trim(),
      banner_image_id: bannerImageId.trim() === "" ? null : bannerImageId.trim(),
    })
  }, [
    clearError,
    save,
    descriptionJson,
    seoTitle,
    seoDescription,
    ogImageId,
    bannerImageId,
  ])

  const onDiscard = useCallback(async () => {
    setValidationError(null)
    clearError()
    await load()
  }, [clearError, load])

  const disabled = loading || saving
  const seoTooLong = seoDescription.length > SEO_DESCRIPTION_MAX
  const bannerError = validationError ?? error

  const hasAnyImageId = ogImageId.trim() !== "" || bannerImageId.trim() !== ""

  return (
    <div className="space-y-6">
      <div aria-live="polite" className="sr-only">
        {saving ? "Saving category content." : ""}
      </div>

      {bannerError ? (
        <div
          role="alert"
          className="rounded-md border border-border-strong bg-surface-subtle px-3 py-2 text-sm text-content-primary"
        >
          {bannerError}
        </div>
      ) : null}

      <form
        id={formId}
        onSubmit={(e) => {
          e.preventDefault()
          void onSave()
        }}
        className="space-y-6"
      >
        <Card>
          <h2 className="text-lg font-semibold text-content-primary">Description</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Rich text is stored as TipTap JSON (not HTML).
          </p>
          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium text-content-primary">
              Body
            </span>
            <ProductDescriptionEditor
              value={descriptionJson}
              onChange={setDescriptionJson}
              disabled={disabled}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-content-primary">SEO</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Meta title and description for this locale. Description is limited to{" "}
            {SEO_DESCRIPTION_MAX} characters in the API.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor={`${formId}-seo-title`}
                  className="block text-sm font-medium text-content-primary"
                >
                  Meta title
                </label>
                <input
                  id={`${formId}-seo-title`}
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value)
                  }}
                  disabled={disabled}
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor={`${formId}-seo-desc`}
                  className="block text-sm font-medium text-content-primary"
                >
                  Meta description
                </label>
                <textarea
                  id={`${formId}-seo-desc`}
                  value={seoDescription}
                  onChange={(e) => {
                    const v = e.target.value
                    setSeoDescription(v)
                    if (v.length <= SEO_DESCRIPTION_MAX) {
                      setValidationError(null)
                    }
                  }}
                  onBlur={() => {
                    if (seoDescription.length > SEO_DESCRIPTION_MAX) {
                      setValidationError(
                        `SEO description must be at most ${SEO_DESCRIPTION_MAX} characters (currently ${seoDescription.length}).`
                      )
                    }
                  }}
                  disabled={disabled}
                  rows={4}
                  aria-invalid={seoTooLong}
                  aria-describedby={`${formId}-seo-desc-counter`}
                  className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
                />
                <p
                  id={`${formId}-seo-desc-counter`}
                  className={`mt-1 text-xs ${seoTooLong ? "font-medium text-content-danger" : "text-content-tertiary"}`}
                >
                  {seoDescription.length} / {SEO_DESCRIPTION_MAX} characters
                  {seoTooLong ? " — shorten before saving." : ""}
                </p>
              </div>
            </div>
            <div>
              <SEOPreview
                title={seoTitle}
                description={seoDescription}
                fallbackTitle={categoryTitleFallback}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-content-primary">Images</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Optional Medusa file / media IDs for Open Graph and category banner. No upload widget
            in this shell — use IDs from your dev database.
          </p>
          {!hasAnyImageId ? (
            <p className="mt-3 text-sm text-content-tertiary" role="status">
              No image IDs set yet. Add an OG or banner id below.
            </p>
          ) : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`${formId}-og-image`}
                className="block text-sm font-medium text-content-primary"
              >
                Open Graph image ID
              </label>
              <input
                id={`${formId}-og-image`}
                type="text"
                value={ogImageId}
                onChange={(e) => {
                  setOgImageId(e.target.value)
                }}
                disabled={disabled}
                autoComplete="off"
                placeholder="Optional"
                className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor={`${formId}-banner-image`}
                className="block text-sm font-medium text-content-primary"
              >
                Banner image ID
              </label>
              <input
                id={`${formId}-banner-image`}
                type="text"
                value={bannerImageId}
                onChange={(e) => {
                  setBannerImageId(e.target.value)
                }}
                disabled={disabled}
                autoComplete="off"
                placeholder="Optional"
                className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
              />
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled || seoTooLong}
            className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-content-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save content"}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              void onDiscard()
            }}
            className="rounded-md border border-border-default bg-surface-default px-4 py-2 text-sm font-medium text-content-primary shadow-sm hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
          >
            Discard changes
          </button>
          {loading ? (
            <span className="text-sm text-content-secondary">Loading content…</span>
          ) : null}
        </div>
      </form>
    </div>
  )
}
