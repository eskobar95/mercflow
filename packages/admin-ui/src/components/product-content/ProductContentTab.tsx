import type { JSONContent } from "@tiptap/core"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"

import { ContentLocaleSwitcher } from "@/components/content-locale/ContentLocaleSwitcher"
import { ContentLocaleUnsavedDialog } from "@/components/content-locale/ContentLocaleUnsavedDialog"
import { Card } from "@/components/ui/Card"
import { useAdminLocales, useContentLocale } from "@/features/content-locale"
import {
  DEFAULT_PRODUCT_CONTENT_LOCALE,
  useProductContentState,
} from "@/features/product-content"

import { isProductContentDirty } from "./productContentDirty"
import { MediaGalleryManager } from "./MediaGalleryManager"
import { ProductDescriptionEditor } from "./ProductDescriptionEditor"
import { SEOPreview } from "./SEOPreview"
import { EMPTY_TIPTAP_DOC, tiptapDocFromUnknown } from "@/lib/tiptap"

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
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false)
  const pendingLocaleRef = useRef<string | null>(null)
  const localeBeforeSwitchRef = useRef<string | null>(null)

  const { locales, loading: localesLoading, error: localesError } = useAdminLocales()
  const { activeLocaleCode, setActiveLocaleCode } = useContentLocale({
    locales,
    preferredCode: locales[0]?.code ?? DEFAULT_PRODUCT_CONTENT_LOCALE,
  })

  const completeLocaleSwitch = useCallback(
    (next: string): void => {
      if (next === activeLocaleCode) {
        return
      }
      localeBeforeSwitchRef.current = activeLocaleCode
      setActiveLocaleCode(next)
    },
    [activeLocaleCode, setActiveLocaleCode]
  )

  const {
    content,
    loading,
    saving,
    loadError,
    saveError,
    save,
    load,
    clearError,
  } = useProductContentState({
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

  useEffect(() => {
    if (loading || localesLoading) {
      return
    }
    if (loadError !== null && localeBeforeSwitchRef.current !== null) {
      const revertTo = localeBeforeSwitchRef.current
      localeBeforeSwitchRef.current = null
      if (activeLocaleCode !== revertTo) {
        setActiveLocaleCode(revertTo)
      }
    }
  }, [loading, localesLoading, loadError, activeLocaleCode, setActiveLocaleCode])

  const isDirty = useMemo(
    () =>
      isProductContentDirty(content, {
        descriptionJson,
        seoTitle,
        seoDescription,
        ogImageId,
        galleryIds,
      }),
    [content, descriptionJson, seoTitle, seoDescription, ogImageId, galleryIds]
  )

  const clearPendingLocale = useCallback((): void => {
    pendingLocaleRef.current = null
  }, [])

  const requestLocaleChange = useCallback(
    (next: string): void => {
      if (next === activeLocaleCode) {
        return
      }
      if (!isDirty) {
        completeLocaleSwitch(next)
        return
      }
      pendingLocaleRef.current = next
      setUnsavedDialogOpen(true)
    },
    [activeLocaleCode, isDirty, completeLocaleSwitch]
  )

  const runSave = useCallback(async (): Promise<boolean> => {
    clearError()
    if (seoDescription.length > SEO_DESCRIPTION_MAX) {
      setValidationError(
        `SEO description must be at most ${SEO_DESCRIPTION_MAX} characters (currently ${seoDescription.length}).`
      )
      return false
    }
    setValidationError(null)
    return save({
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

  const onSave = useCallback(async () => {
    void runSave()
  }, [runSave])

  const onDiscard = useCallback(async () => {
    setValidationError(null)
    clearError()
    await load()
  }, [clearError, load])

  const onDialogSave = useCallback(async () => {
    const ok = await runSave()
    if (!ok) {
      return
    }
    const target = pendingLocaleRef.current
    pendingLocaleRef.current = null
    setUnsavedDialogOpen(false)
    if (target !== null) {
      completeLocaleSwitch(target)
    }
  }, [runSave, completeLocaleSwitch])

  const onDialogDiscard = useCallback(async () => {
    clearError()
    const ok = await load()
    if (!ok) {
      return
    }
    const target = pendingLocaleRef.current
    pendingLocaleRef.current = null
    setUnsavedDialogOpen(false)
    if (target !== null) {
      completeLocaleSwitch(target)
    }
  }, [clearError, load, completeLocaleSwitch])

  const disabled = loading || saving
  const localeSwitcherDisabled = disabled || localesLoading || locales.length === 0
  const seoTooLong = seoDescription.length > SEO_DESCRIPTION_MAX
  const bannerError = validationError ?? loadError ?? saveError

  return (
    <div className="space-y-6">
      <ContentLocaleUnsavedDialog
        open={unsavedDialogOpen}
        onOpenChange={setUnsavedDialogOpen}
        actionDisabled={loading || saving}
        onSave={() => {
          void onDialogSave()
        }}
        onDiscard={() => {
          void onDialogDiscard()
        }}
        onClose={clearPendingLocale}
      />

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
          Could not load the language list from Medusa. Check your connection and admin session,
          then refresh. ({localesError})
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
          onChange={requestLocaleChange}
          disabled={localeSwitcherDisabled}
          localesLoading={localesLoading}
          resolvedContentLocale={content?.locale ?? null}
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
