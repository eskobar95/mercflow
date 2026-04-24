import type { JSONContent } from "@tiptap/core"
import { useCallback, useEffect, useId, useState } from "react"

import { ContentLocaleSwitcher } from "@/components/content-locale/ContentLocaleSwitcher"
import { Card } from "@/components/ui/Card"
import { useAdminLocales, useContentLocale } from "@/features/content-locale"
import {
  DEFAULT_PRODUCT_CONTENT_LOCALE,
  useProductContentState,
} from "@/features/product-content"

import { MediaGalleryManager } from "./MediaGalleryManager"
import { ProductDescriptionEditor } from "./ProductDescriptionEditor"
import { SEOPreview } from "./SEOPreview"
import { EMPTY_TIPTAP_DOC, tiptapDocFromUnknown } from "./tiptapDoc"

const SEO_DESCRIPTION_MAX = 160

export type ProductContentTabProps = {
  productId: string
  /** Used in SEO preview when meta title is empty */
  productTitleFallback: string
}

export function ProductContentTab({
  productId,
  productTitleFallback,
}: ProductContentTabProps): JSX.Element {
  const formId = useId()
  const { locales, loading: localesLoading, error: localesError } = useAdminLocales()
  const { activeLocaleCode, setActiveLocaleCode } = useContentLocale({
    locales,
    preferredCode: DEFAULT_PRODUCT_CONTENT_LOCALE,
  })
  const { content, loading, saving, error, save, clearError } = useProductContentState({
    productId,
    locale: activeLocaleCode,
  })

  const [descriptionJson, setDescriptionJson] = useState<JSONContent>(EMPTY_TIPTAP_DOC)
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [ogImageId, setOgImageId] = useState("")
  const [galleryIds, setGalleryIds] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) {
      return
    }
    setDescriptionJson(tiptapDocFromUnknown(content?.description_rich))
    setSeoTitle(content?.seo_title ?? "")
    setSeoDescription(content?.seo_description ?? "")
    setOgImageId(content?.seo_og_image_id ?? "")
    setGalleryIds(content?.media_gallery ? [...content.media_gallery] : [])
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
      media_gallery: galleryIds.length === 0 ? null : galleryIds,
    })
  }, [
    clearError,
    save,
    descriptionJson,
    seoTitle,
    seoDescription,
    ogImageId,
    galleryIds,
  ])

  const disabled = loading || saving
  const localeSwitcherDisabled = disabled || localesLoading
  const seoTooLong = seoDescription.length > SEO_DESCRIPTION_MAX
  const bannerError = validationError ?? error

  return (
    <div className="space-y-6">
      <div aria-live="polite" className="sr-only">
        {saving ? "Saving product content." : ""}
      </div>

      {bannerError ? (
        <div
          role="alert"
          className="rounded-md border border-border-strong bg-surface-subtle px-3 py-2 text-sm text-content-primary"
        >
          {bannerError}
        </div>
      ) : null}

      {localesError ? (
        <div
          role="alert"
          className="rounded-md border border-border-strong bg-surface-subtle px-3 py-2 text-sm text-content-danger"
        >
          Could not load editing languages: {localesError}
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
        <ContentLocaleSwitcher
          locales={locales}
          value={activeLocaleCode}
          onChange={setActiveLocaleCode}
          disabled={localeSwitcherDisabled}
        />

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
              <div>
                <label
                  htmlFor={`${formId}-og-image`}
                  className="block text-sm font-medium text-content-primary"
                >
                  Open Graph image ID
                </label>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  Optional file / media id for social previews.
                </p>
                <input
                  id={`${formId}-og-image`}
                  type="text"
                  value={ogImageId}
                  onChange={(e) => {
                    setOgImageId(e.target.value)
                  }}
                  disabled={disabled}
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <SEOPreview
                title={seoTitle}
                description={seoDescription}
                fallbackTitle={productTitleFallback}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-content-primary">Media gallery</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Ordered list of media IDs sent as <code className="text-xs">media_gallery</code> on
            save.
          </p>
          <div className="mt-4">
            <MediaGalleryManager value={galleryIds} onChange={setGalleryIds} disabled={disabled} />
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
          {loading ? (
            <span className="text-sm text-content-secondary">Loading content…</span>
          ) : null}
        </div>
      </form>
    </div>
  )
}
