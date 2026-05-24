import type { JSONContent } from "@tiptap/core"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"

import { ContentLocaleSwitcher } from "@/components/content-locale/ContentLocaleSwitcher"
import { ContentLocaleUnsavedDialog } from "@/components/content-locale/ContentLocaleUnsavedDialog"
import { ProductDescriptionEditor } from "@/components/product-content/ProductDescriptionEditor"
import { SEOPreview } from "@/components/product-content/SEOPreview"
import { EMPTY_TIPTAP_DOC, tiptapDocFromUnknown } from "@/lib/tiptap"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { sectionDescClass, sectionTitleClass } from "@/components/ui/formStyles"
import { FormField } from "@/components/ui/FormField"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import {
  DEFAULT_CATEGORY_CONTENT_LOCALE,
  useCategoryContentState,
} from "@/features/category-content"
import { useAdminLocales, useContentLocale } from "@/features/content-locale"

import { isCategoryContentDirty } from "./categoryContentDirty"

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
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false)
  const pendingLocaleRef = useRef<string | null>(null)
  const localeBeforeSwitchRef = useRef<string | null>(null)

  const { locales, loading: localesLoading, error: localesError } = useAdminLocales()
  const { activeLocaleCode, setActiveLocaleCode } = useContentLocale({
    locales,
    preferredCode: locales[0]?.code ?? DEFAULT_CATEGORY_CONTENT_LOCALE,
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
  } = useCategoryContentState({
    categoryId,
    locale: activeLocaleCode,
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
      isCategoryContentDirty(content, {
        descriptionJson,
        seoTitle,
        seoDescription,
        ogImageId,
        bannerImageId,
      }),
    [content, descriptionJson, seoTitle, seoDescription, ogImageId, bannerImageId]
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

  const hasAnyImageId = ogImageId.trim() !== "" || bannerImageId.trim() !== ""

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

        <Card elevation="flat">
          <h2 className={sectionTitleClass}>Description</h2>
          <p className={sectionDescClass}>
            Rich text is stored as TipTap JSON (not HTML).
          </p>
          <div className="-mx-6 -mb-6 mt-5 border-t border-border-subtle">
            <ProductDescriptionEditor
              value={descriptionJson}
              onChange={setDescriptionJson}
              disabled={disabled}
              variant="embedded"
            />
          </div>
        </Card>

        <Card elevation="flat">
          <h2 className={sectionTitleClass}>SEO</h2>
          <p className={sectionDescClass}>
            Meta title and description for this locale. Description is limited to{" "}
            {SEO_DESCRIPTION_MAX} characters in the API.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <FormField label="Meta title" htmlFor={`${formId}-seo-title`}>
                <Input
                  id={`${formId}-seo-title`}
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value)
                  }}
                  disabled={disabled}
                  autoComplete="off"
                />
              </FormField>
              <FormField
                label="Meta description"
                htmlFor={`${formId}-seo-desc`}
                hint={`${seoDescription.length} / ${SEO_DESCRIPTION_MAX} characters${seoTooLong ? " — shorten before saving." : ""}`}
                error={
                  seoTooLong
                    ? `Must be at most ${SEO_DESCRIPTION_MAX} characters.`
                    : undefined
                }
              >
                <Textarea
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
                        `SEO description must be at most ${SEO_DESCRIPTION_MAX} characters (currently ${seoDescription.length}).`,
                      )
                    }
                  }}
                  disabled={disabled}
                  rows={4}
                  error={seoTooLong}
                  aria-invalid={seoTooLong}
                  aria-describedby={`${formId}-seo-desc-counter`}
                />
              </FormField>
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

        <Card elevation="flat">
          <h2 className={sectionTitleClass}>Images</h2>
          <p className={sectionDescClass}>
            Optional Medusa file / media IDs for Open Graph and category banner. No upload widget
            in this shell — use IDs from your dev database.
          </p>
          {!hasAnyImageId ? (
            <p className="mt-3 text-sm text-content-tertiary" role="status">
              No image IDs set yet. Add an OG or banner id below.
            </p>
          ) : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Open Graph image ID"
              htmlFor={`${formId}-og-image`}
              hint="Optional file / media id for social previews."
            >
              <Input
                id={`${formId}-og-image`}
                type="text"
                value={ogImageId}
                onChange={(e) => {
                  setOgImageId(e.target.value)
                }}
                disabled={disabled}
                autoComplete="off"
                placeholder="Optional"
              />
            </FormField>
            <FormField label="Banner image ID" htmlFor={`${formId}-banner-image`}>
              <Input
                id={`${formId}-banner-image`}
                type="text"
                value={bannerImageId}
                onChange={(e) => {
                  setBannerImageId(e.target.value)
                }}
                disabled={disabled}
                autoComplete="off"
                placeholder="Optional"
              />
            </FormField>
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={disabled || seoTooLong}>
            {saving ? "Saving…" : "Save content"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            onClick={() => {
              void onDiscard()
            }}
          >
            Discard changes
          </Button>
          {loading ? (
            <span className="text-sm text-content-secondary">Loading content…</span>
          ) : null}
        </div>
      </form>
    </div>
  )
}
