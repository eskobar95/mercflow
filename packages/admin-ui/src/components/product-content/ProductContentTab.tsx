import { useCallback } from "react"

import { Card } from "@/components/ui/Card"
import {
  DEFAULT_PRODUCT_CONTENT_LOCALE,
  useProductContentState,
} from "@/features/product-content"
import { EMPTY_TIPTAP_DOC, plaintextPreviewFromTiptapJson } from "@/lib/tiptap"

const BODY_PREVIEW_MAX = 200

function localeBadgeLabel(locale: string): string {
  const norm = locale.trim()
  if (norm.length === 0) {
    return "—"
  }
  const sub = norm.split("-")[0]
  return sub?.toUpperCase() ?? norm.toUpperCase()
}

export type ProductContentTabProps = {
  productId: string
  /** Used when meta title is empty in previews */
  productTitleFallback: string
}

export function ProductContentTab({
  productId,
  productTitleFallback,
}: ProductContentTabProps): JSX.Element {
  const locale = DEFAULT_PRODUCT_CONTENT_LOCALE
  const { content, loading, saving, loadError, saveError, save, load, clearError } =
    useProductContentState({
      productId,
      locale,
      loadOnMount: true,
    })

  const bannerError = loadError ?? saveError

  const onAddContent = useCallback(async () => {
    clearError()
    await save({
      description_rich: EMPTY_TIPTAP_DOC,
      seo_title: null,
      seo_description: null,
      seo_og_image_id: null,
      media_gallery: null,
    })
  }, [clearError, save])

  const onRetryLoad = useCallback(async () => {
    clearError()
    await load()
  }, [clearError, load])

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <p className="text-sm text-content-secondary">Loading CMS content…</p>
      </div>
    )
  }

  if (bannerError !== null) {
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
          Create initial CMS placeholders for rich text (TipTap JSON) and SEO metadata.
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

  const preview = plaintextPreviewFromTiptapJson(content.body_json, BODY_PREVIEW_MAX)
  const seoTitleFallback = content.seo_title?.trim()
    ?? (productTitleFallback.trim() !== "" ? productTitleFallback.trim() : "—")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-content-primary">Locale</span>
        <span className="inline-flex items-center rounded-full border border-border-default bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-content-primary">
          {localeBadgeLabel(content.locale)}
        </span>
        <span className="text-xs text-content-tertiary">
          Editing language switching is Sprint 4; reads currently use only the configured default locale
          passed to <code className="text-xs">GET /admin/product-content</code>.
        </span>
      </div>

      <Card className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-content-primary">Body preview</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Stored as TipTap JSON; showing the first {BODY_PREVIEW_MAX} characters of plaintext.
          </p>
        </div>
        <p className="rounded-md border border-border-subtle bg-surface-default p-4 text-sm text-content-primary whitespace-pre-wrap">
          {preview.length === 0 ? "(No text in this locale yet.)" : preview}
        </p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-content-primary">SEO</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-content-tertiary">Preview title</dt>
            <dd className="mt-1 font-medium text-content-primary">{seoTitleFallback}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-content-tertiary">Meta title</dt>
            <dd className="mt-1 text-content-primary">
              {content.seo_title != null && content.seo_title.trim() !== ""
                ? content.seo_title
                : "(Not set)"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-content-tertiary">Meta description</dt>
            <dd className="mt-1 text-content-primary">
              {content.seo_description != null && content.seo_description.trim() !== ""
                ? content.seo_description
                : "(Not set)"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-content-tertiary">Open Graph image URL</dt>
            <dd className="mt-1 break-all text-content-primary">
              {content.og_image_url != null && content.og_image_url.length > 0
                ? content.og_image_url
                : "(Not set)"}
            </dd>
          </div>
        </dl>
      </Card>

      <p className="text-xs text-content-tertiary">
        Rich text and SEO field editing arrives in Sprint 3; this tab is read-only for MER-26.
      </p>
    </div>
  )
}
