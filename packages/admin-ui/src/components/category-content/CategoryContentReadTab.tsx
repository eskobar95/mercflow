import { type ReactNode, useCallback, useEffect, useId, useMemo, useState } from "react"

import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import {
  DEFAULT_CATEGORY_CONTENT_LOCALE,
  getCategoryContentRead,
} from "@/features/category-content/categoryContentApi"
import type { CategoryContentReadPayload } from "@/features/category-content/types"
import { useAdminLocales } from "@/features/content-locale"
import { preferProductContentLocale } from "@/features/product-content/preferProductContentLocale"
import { plaintextPreviewFromTiptapJson } from "@/lib/tiptap"

function localeBadgeLabel(locale: string): string {
  const norm = locale.trim()
  if (norm.length === 0) {
    return "—"
  }
  const sub = norm.split("-")[0]
  return sub?.toUpperCase() ?? norm.toUpperCase()
}

export type CategoryContentReadTabProps = {
  categoryId: string
  categoryTitleFallback: string
}

export function CategoryContentReadTab({
  categoryId,
  categoryTitleFallback,
}: CategoryContentReadTabProps): ReactNode {
  const sectionIds = useId()
  const localesQuery = useAdminLocales()
  const readLocale = preferProductContentLocale(localesQuery.locales, DEFAULT_CATEGORY_CONTENT_LOCALE)

  const [payload, setPayload] = useState<CategoryContentReadPayload | null | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true)
    setLoadError(null)
    try {
      const next = await getCategoryContentRead(categoryId, readLocale)
      setPayload(next ?? null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load category content."
      setLoadError(message)
      setPayload(undefined)
    } finally {
      setLoading(false)
    }
  }, [categoryId, readLocale])

  useEffect(() => {
    void reload()
  }, [reload])

  const previewText = useMemo((): string => {
    if (!payload?.body_json) {
      return ""
    }
    return plaintextPreviewFromTiptapJson(payload.body_json, 800)
  }, [payload])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-content-secondary">
          Read-only MercFlow CMS snapshot for this category. Editing ships in a later sprint.
        </p>
        <Badge variant="neutral">{localeBadgeLabel(readLocale)}</Badge>
        {!localesQuery.loading && localesQuery.error === null ? (
          <span className="text-xs text-content-tertiary">Loaded from Medusa locale list</span>
        ) : null}
      </div>

      {localesQuery.loading ? (
        <Card>
          <p className="text-sm text-content-tertiary">Loading locale list…</p>
        </Card>
      ) : null}

      {localesQuery.error !== null ? (
        <Card>
          <p className="text-sm font-medium text-feedback-danger-content">{localesQuery.error}</p>
          <p className="mt-1 text-xs text-content-secondary">
            Category content requests need a valid `locale` query; fix locale loading to continue.
          </p>
        </Card>
      ) : null}

      {loadError !== null ? (
        <Card>
          <p className="text-sm font-medium text-feedback-danger-content">{loadError}</p>
        </Card>
      ) : null}

      {loading && loadError === null ? (
        <Card>
          <p className="text-sm text-content-tertiary">Loading MercFlow category content…</p>
        </Card>
      ) : null}

      {!loading && loadError === null && payload === null ? (
        <Card>
          <h2
            id={`${sectionIds}-empty`}
            className="text-lg font-semibold text-content-primary"
          >
            No MercFlow content yet
          </h2>
          <p className="mt-2 text-sm text-content-secondary">
            There is no `category_content` row for locale <strong>{readLocale}</strong> on category{" "}
            <span className="font-mono text-xs">{categoryId}</span>. Create one via the Medusa admin API
            or a future authoring flow — this tab stays read-only in this sprint.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md border border-border-subtle bg-surface-raised px-3 py-1.5 text-sm font-medium text-content-primary hover:border-border-strong"
            onClick={() => {
              void reload()
            }}
          >
            Retry fetch
          </button>
        </Card>
      ) : null}

      {!loading && loadError === null && payload !== null && payload !== undefined ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 id={`${sectionIds}-preview`} className="text-lg font-semibold text-content-primary">
                Description preview
              </h2>
            </div>
            <p className="mt-2 text-xs text-content-tertiary">
              Snapshot at version {payload.version} · catalog visibility {payload.status}
            </p>
            <div className="mt-4 text-sm leading-relaxed text-content-secondary whitespace-pre-wrap">
              {previewText.trim() === ""
                ? "No rich description stored for this locale."
                : previewText}
            </div>
          </Card>

          <Card>
            <h2 id={`${sectionIds}-seo`} className="text-lg font-semibold text-content-primary">
              SEO fields
            </h2>
            <p className="mt-1 text-xs text-content-tertiary">
              Browser title uses meta title below; search snippets use meta description ({categoryTitleFallback}{" "}
              is the fallback headline when titles are blank).
            </p>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-content-tertiary">Meta title</dt>
                <dd className="mt-1 text-content-primary">
                  {payload.seo_title?.trim()
                    ? payload.seo_title
                    : `${categoryTitleFallback} · category`}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-content-tertiary">Meta description</dt>
                <dd className="mt-1 text-content-secondary">
                  {payload.seo_description ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-content-tertiary">OG image URL</dt>
                <dd className="mt-1 break-all font-mono text-xs text-content-primary">
                  {payload.og_image_url ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-content-tertiary">Banner image URL</dt>
                <dd className="mt-1 break-all font-mono text-xs text-content-primary">
                  {payload.banner_image_url ?? "—"}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
