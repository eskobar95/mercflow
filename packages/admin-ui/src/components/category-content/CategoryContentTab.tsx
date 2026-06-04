import type { JSONContent } from "@tiptap/core"
import { useCallback, useEffect, useId, useMemo, useState } from "react"

import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { useAdminLocales } from "@/features/content-locale"
import {
  DEFAULT_CATEGORY_CONTENT_LOCALE,
  useCategoryContentState,
} from "@/features/category-content"
import { preferCategoryContentLocale } from "@/features/category-content/preferCategoryContentLocale"
import { EMPTY_TIPTAP_DOC, tiptapDocFromUnknown } from "@/lib/tiptap"

import { ProductDescriptionEditor } from "../product-content/ProductDescriptionEditor"
import { SEOPreview } from "../product-content/SEOPreview"

import { isCategoryContentDirty } from "./categoryContentDirty"

const SEO_DESCRIPTION_MAX = 160
const SEO_TITLE_MAX = 255

function localeBadgeLabel(locale: string): string {
  const norm = locale.trim()
  if (norm.length === 0) {
    return "—"
  }
  const sub = norm.split("-")[0]
  return sub?.toUpperCase() ?? norm.toUpperCase()
}

export type CategoryContentTabProps = {
  categoryId: string
  /** Used when meta title is empty in previews */
  categoryTitleFallback: string
}

export function CategoryContentTab({
  categoryId,
  categoryTitleFallback,
}: CategoryContentTabProps): JSX.Element {
  const formId = useId()
  const { locales, loading: localesLoading, error: localesError } = useAdminLocales()
  const readLocale = preferCategoryContentLocale(locales, DEFAULT_CATEGORY_CONTENT_LOCALE)

  const { content, loading, saving, loadError, saveError, save, load, clearError } =
    useCategoryContentState({
      categoryId,
      locale: readLocale,
      loadOnMount: true,
    })

  const [descriptionJson, setDescriptionJson] = useState<JSONContent>(EMPTY_TIPTAP_DOC)
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [ogUrl, setOgUrl] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (loading || content === null) {
      return
    }
    setDescriptionJson(tiptapDocFromUnknown(content.body_json))
    setSeoTitle(content.seo_title ?? "")
    setSeoDescription(content.seo_description ?? "")
    setOgUrl(content.og_image_url ?? "")
    setBannerUrl(content.banner_image_url ?? "")
    setValidationError(null)
  }, [loading, content])

  const isDirty = useMemo(
    () =>
      content !== null &&
      isCategoryContentDirty(content, {
        descriptionJson,
        seoTitle,
        seoDescription,
        ogImageUrl: ogUrl,
        bannerImageUrl: bannerUrl,
      }),
    [content, descriptionJson, seoTitle, seoDescription, ogUrl, bannerUrl]
  )

  const bannerError = validationError ?? loadError ?? saveError
  const seoTitleTooLong = seoTitle.length > SEO_TITLE_MAX
  const seoDescriptionTooLong = seoDescription.length > SEO_DESCRIPTION_MAX
  const disabled = loading || saving

  const onAddContent = useCallback(async (): Promise<void> => {
    clearError()
    void save({
      description_rich: EMPTY_TIPTAP_DOC,
      seo_title: null,
      seo_description: null,
      seo_og_image_id: null,
      banner_image_id: null,
    })
  }, [clearError, save])

  const onDiscard = useCallback(async () => {
    setValidationError(null)
    clearError()
    await load()
  }, [clearError, load])

  const runSave = useCallback(async (): Promise<boolean> => {
    clearError()
    if (seoTitleTooLong || seoDescriptionTooLong) {
      setValidationError(
        seoTitleTooLong
          ? `Meta title must be at most ${SEO_TITLE_MAX} characters (currently ${seoTitle.length}).`
          : `SEO description must be at most ${SEO_DESCRIPTION_MAX} characters (currently ${seoDescription.length}).`
      )
      return false
    }
    setValidationError(null)
    return save({
      description_rich: descriptionJson,
      seo_title: seoTitle.trim() === "" ? null : seoTitle.trim(),
      seo_description: seoDescription.trim() === "" ? null : seoDescription.trim(),
      seo_og_image_id: ogUrl.trim() === "" ? null : ogUrl.trim(),
      banner_image_id: bannerUrl.trim() === "" ? null : bannerUrl.trim(),
    })
  }, [
    bannerUrl,
    clearError,
    descriptionJson,
    ogUrl,
    save,
    seoDescription,
    seoDescriptionTooLong,
    seoTitle,
    seoTitleTooLong,
  ])

  const onRetryLoad = useCallback(async () => {
    clearError()
    await load()
  }, [clearError, load])

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

  if (bannerError !== null && content === null) {
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

  if (content === null) {
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

  const seoPreviewTitle =
    seoTitle.trim() !== ""
      ? seoTitle
      : categoryTitleFallback.trim() !== ""
        ? categoryTitleFallback
        : ""

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
            onChange={setDescriptionJson}
            variant="embedded"
            disabled={disabled}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-content-primary">SEO</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Meta limits follow MercFlow CMS rules (title {SEO_TITLE_MAX} chars, snippet{" "}
            {SEO_DESCRIPTION_MAX}).
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
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
                  aria-invalid={seoTitleTooLong}
                  aria-describedby={`${formId}-seo-title-counter`}
                  className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
                />
                <p
                  id={`${formId}-seo-title-counter`}
                  className={`mt-1 text-xs ${seoTitleTooLong ? "font-medium text-content-danger" : "text-content-tertiary"}`}
                >
                  {seoTitle.length} / {SEO_TITLE_MAX} characters
                  {seoTitleTooLong ? " — shorten before saving." : ""}
                </p>
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
                  onChange={(e): void => {
                    const v = e.target.value
                    setSeoDescription(v)
                  }}
                  onBlur={(): void => {
                    if (seoDescription.length > SEO_DESCRIPTION_MAX) {
                      setValidationError(
                        `SEO description must be at most ${SEO_DESCRIPTION_MAX} characters (currently ${seoDescription.length}).`
                      )
                    }
                  }}
                  disabled={disabled}
                  rows={4}
                  aria-invalid={seoDescriptionTooLong}
                  aria-describedby={`${formId}-seo-desc-counter`}
                  className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
                />
                <p
                  id={`${formId}-seo-desc-counter`}
                  className={`mt-1 text-xs ${seoDescriptionTooLong ? "font-medium text-content-danger" : "text-content-tertiary"}`}
                >
                  {seoDescription.length} / {SEO_DESCRIPTION_MAX} characters
                  {seoDescriptionTooLong ? " — shorten before saving." : ""}
                </p>
              </div>
            </div>
            <div>
              <SEOPreview
                title={seoPreviewTitle}
                description={seoDescription}
                fallbackTitle={categoryTitleFallback}
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-content-primary">Images</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Open Graph and banner values are persisted on the MercFlow CMS row (IDs or URLs, depending
            on your environment).
          </p>
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`${formId}-og-url`}
                className="block text-sm font-medium text-content-primary"
              >
                Open Graph media reference
              </label>
              <input
                id={`${formId}-og-url`}
                type="text"
                value={ogUrl}
                onChange={(e) => {
                  setOgUrl(e.target.value)
                }}
                disabled={disabled}
                autoComplete="off"
                placeholder="Media id or URL"
                className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
              />
              <p className="mt-0.5 text-xs text-content-tertiary">
                Sent as <span className="font-mono">seo_og_image_id</span> on save.
              </p>
            </div>
            <div>
              <label
                htmlFor={`${formId}-banner-url`}
                className="block text-sm font-medium text-content-primary"
              >
                Banner media reference
              </label>
              <input
                id={`${formId}-banner-url`}
                type="text"
                value={bannerUrl}
                onChange={(e) => {
                  setBannerUrl(e.target.value)
                }}
                disabled={disabled}
                autoComplete="off"
                placeholder="Media id or URL"
                className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-1.5 text-sm text-content-primary shadow-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-border-focus disabled:opacity-50"
              />
              <p className="mt-0.5 text-xs text-content-tertiary">
                Sent as <span className="font-mono">banner_image_id</span> on save.
              </p>
            </div>
          </div>
        </Card>

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
