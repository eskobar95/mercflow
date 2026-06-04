import type { JSX } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  createCmsPage,
  deleteCmsPage,
  fetchCmsPageById,
  patchCmsPage,
  type CmsPageType,
  type CmsPageStatus,
} from "@/features/cms-pages/cmsPagesAdminApi"
import { slugifyCategoryHandle } from "@/features/product-categories/slugifyCategoryHandle"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

const PAGE_TYPES: { value: CmsPageType; label: string }[] = [
  { value: "homepage", label: "Homepage" },
  { value: "landing", label: "Landing" },
  { value: "content", label: "Content" },
]

export function PageEditPage(): JSX.Element {
  const { pageId } = useParams<{ pageId: string }>()
  const navigate = useNavigate()
  const isNew = pageId === "new"

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const slugTouchedRef = useRef(false)
  const [pageType, setPageType] = useState<CmsPageType>("content")
  const [status, setStatus] = useState<CmsPageStatus>("draft")
  const [blockCount, setBlockCount] = useState<number | null>(null)

  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isNew || !pageId) {
      setIsLoading(false)
      setBlockCount(0)
      return
    }

    const base = resolveMedusaAdminBackendUrl()
    if (base === null) {
      setLoadError("Missing VITE_MEDUSA_ADMIN_BACKEND_URL.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)
    void (async (): Promise<void> => {
      try {
        const row = await fetchCmsPageById(pageId)
        if (!row) {
          setLoadError("Page not found.")
          return
        }
        setTitle(row.title)
        setSlug(row.slug)
        slugTouchedRef.current = true
        setPageType(row.page_type)
        setStatus(row.status)
        setBlockCount(row.block_count)
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Unable to load page.")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [isNew, pageId])

  const onTitleChange = useCallback((value: string): void => {
    setTitle(value)
    if (!slugTouchedRef.current) {
      const next = slugifyCategoryHandle(value)
      setSlug(next)
    }
  }, [])

  const onSlugChange = useCallback((value: string): void => {
    slugTouchedRef.current = true
    setSlug(value)
  }, [])

  const onSave = useCallback((): void => {
    const base = resolveMedusaAdminBackendUrl()
    if (base === null) {
      setSaveError("Missing VITE_MEDUSA_ADMIN_BACKEND_URL.")
      return
    }
    if (!title.trim() || !slug.trim()) {
      setSaveError("Title and slug are required.")
      return
    }

    setSaveError(null)
    setIsSaving(true)
    void (async (): Promise<void> => {
      try {
        if (isNew || !pageId) {
          const created = await createCmsPage({
            title: title.trim(),
            slug: slug.trim(),
            page_type: pageType,
            status,
            locale: "en",
          })
          navigate(`/content/pages/${encodeURIComponent(created.id)}`, { replace: true })
          return
        }
        const updated = await patchCmsPage(pageId, {
          title: title.trim(),
          slug: slug.trim(),
          page_type: pageType,
          status,
        })
        setTitle(updated.title)
        setSlug(updated.slug)
        setPageType(updated.page_type)
        setStatus(updated.status)
        setBlockCount(updated.block_count)
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Save failed.")
      } finally {
        setIsSaving(false)
      }
    })()
  }, [isNew, navigate, pageId, pageType, slug, status, title])

  const onDelete = useCallback((): void => {
    if (isNew || !pageId) {
      return
    }
    if (!window.confirm("Delete this page? This can be restored only from the database layer.")) {
      return
    }
    setSaveError(null)
    setIsSaving(true)
    void (async (): Promise<void> => {
      try {
        await deleteCmsPage(pageId)
        navigate("/content/pages")
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Delete failed.")
      } finally {
        setIsSaving(false)
      }
    })()
  }, [isNew, navigate, pageId])

  if (loadError) {
    return (
      <div className="p-6">
        <div
          role="alert"
          className="rounded-md border border-border-default bg-surface-raised p-4 text-sm text-content-secondary"
        >
          <p className="font-medium text-content-primary">Could not open page</p>
          <p className="mt-2">{loadError}</p>
          <Link
            to="/content/pages"
            className="mt-3 inline-block text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
          >
            Back to pages
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">
            {isNew ? "New page" : "Edit page"}
          </h1>
          <p className="mt-1 text-sm text-content-secondary">
            Slug changes create an automatic redirect for the old public URL.
          </p>
        </div>
        <Link
          to="/content/pages"
          className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
        >
          Back to list
        </Link>
      </div>

      <div className="max-w-xl space-y-6 rounded-lg border border-border-default bg-surface-default p-6 shadow-sm">
        {saveError ? (
          <div
            role="alert"
            className="rounded-md border border-border-default bg-surface-raised p-3 text-sm text-content-secondary"
          >
            {saveError}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-content-secondary">Loading…</p>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="page-title" className="text-sm font-medium text-content-primary">
                Title
              </label>
              <Input
                id="page-title"
                value={title}
                onChange={(e) => {
                  onTitleChange(e.target.value)
                }}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="page-slug" className="text-sm font-medium text-content-primary">
                Slug
              </label>
              <Input
                id="page-slug"
                value={slug}
                onChange={(e) => {
                  onSlugChange(e.target.value)
                }}
                autoComplete="off"
              />
              <p className="text-xs text-content-tertiary">
                Lowercase letters, digits, and hyphens. Auto-filled from the title until you edit this field.
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-content-primary">Page type</legend>
              <div className="flex flex-col gap-2">
                {PAGE_TYPES.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm text-content-secondary">
                    <input
                      type="radio"
                      name="page_type"
                      value={opt.value}
                      checked={pageType === opt.value}
                      onChange={() => {
                        setPageType(opt.value)
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <span className="text-sm font-medium text-content-primary">Status</span>
              <div className="flex flex-wrap gap-4 text-sm text-content-secondary">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="page_status"
                    value="draft"
                    checked={status === "draft"}
                    onChange={() => {
                      setStatus("draft")
                    }}
                  />
                  Draft
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="page_status"
                    value="published"
                    checked={status === "published"}
                    onChange={() => {
                      setStatus("published")
                    }}
                  />
                  Published
                </label>
              </div>
            </div>

            {!isNew ? (
              <div className="rounded-md border border-border-subtle bg-surface-subtle p-4">
                <p className="text-sm font-medium text-content-primary">Blocks</p>
                <p className="mt-1 text-sm text-content-secondary">
                  {blockCount === null ? "—" : `${blockCount} block${blockCount === 1 ? "" : "s"} on the latest version.`}
                </p>
                <div className="mt-3">
                  <Button type="button" variant="secondary" disabled>
                    Edit blocks
                  </Button>
                  <p className="mt-2 text-xs text-content-tertiary">
                    Visual block editing ships in a dedicated page-builder task.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={onSave} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </Button>
              {!isNew ? (
                <Button type="button" variant="secondary" onClick={onDelete} disabled={isSaving}>
                  Delete
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
