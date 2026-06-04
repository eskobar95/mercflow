import type { JSONContent } from "@tiptap/core"
import type { JSX } from "react"
import { useCallback, useEffect, useId, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import { Switch } from "@/components/ui/Switch"

import {
  DEFAULT_ARTICLE_LOCALE,
  createArticleAdmin,
  deleteArticleAdmin,
  getArticleAdmin,
  updateArticleAdmin,
} from "@/features/articles/articlesApi"
import type { ArticleStatus } from "@/features/articles/types"

import { tiptapDocFromUnknown } from "@/lib/tiptap"
import { slugifyTitleToArticleSegment } from "@/lib/transliterateNordicSlug"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) {
    return ""
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return ""
  }
  const pad = (n: number): string => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ArticleEditPage(): JSX.Element {
  const { articleId } = useParams<{ articleId: string }>()
  const navigate = useNavigate()
  const hasBackendConfiguration = resolveMedusaAdminBackendUrl() !== null

  const titleFieldId = useId()
  const slugFieldId = useId()
  const publishedFieldId = useId()
  const statusSwitchId = useId()

  const isNew = articleId === "new"

  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManual, setSlugManual] = useState(false)
  const [body, setBody] = useState<JSONContent>(tiptapDocFromUnknown(null))
  const [status, setStatus] = useState<ArticleStatus>("draft")
  const [publishedLocal, setPublishedLocal] = useState("")

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugifyTitleToArticleSegment(title))
    }
  }, [title, slugManual])

  const load = useCallback(async (): Promise<void> => {
    if (!hasBackendConfiguration || isNew || !articleId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError(null)
    try {
      const row = await getArticleAdmin(articleId)
      setTitle(row.title)
      setSlug(row.slug)
      setSlugManual(true)
      setBody(tiptapDocFromUnknown(row.body_json))
      setStatus(row.status)
      setPublishedLocal(toDatetimeLocalValue(row.published_at))
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load article")
    } finally {
      setIsLoading(false)
    }
  }, [articleId, hasBackendConfiguration, isNew])

  useEffect(() => {
    void load()
  }, [load])

  const onSave = useCallback(async (): Promise<void> => {
    if (!hasBackendConfiguration) {
      return
    }
    setSaveError(null)
    setIsSaving(true)
    try {
      const publishedAtIso =
        status === "published"
          ? publishedLocal.trim() === ""
            ? undefined
            : new Date(publishedLocal).toISOString()
          : null

      const payload = {
        title: title.trim(),
        slug: slug.trim() === "" ? null : slug.trim(),
        body_json: body,
        locale: DEFAULT_ARTICLE_LOCALE,
        status,
        published_at: publishedAtIso,
      }

      if (isNew) {
        const created = await createArticleAdmin(payload)
        navigate(`/content/articles/${encodeURIComponent(created.id)}`, { replace: true })
      } else {
        if (!articleId) {
          setSaveError("Missing article id")
          return
        }
        await updateArticleAdmin(articleId, payload)
        await load()
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setIsSaving(false)
    }
  }, [
    articleId,
    body,
    hasBackendConfiguration,
    isNew,
    load,
    navigate,
    publishedLocal,
    slug,
    status,
    title,
  ])

  const onDelete = useCallback(async (): Promise<void> => {
    if (!articleId || isNew) {
      return
    }
    if (!window.confirm("Delete this article? This can be restored only from the database.")) {
      return
    }
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteArticleAdmin(articleId)
      navigate("/content/articles")
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setIsDeleting(false)
    }
  }, [articleId, isNew, navigate])

  if (!hasBackendConfiguration) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">
          Backend URL missing. Configure{" "}
          <code className="rounded bg-surface-subtle px-1">VITE_MEDUSA_ADMIN_BACKEND_URL</code>{" "}
          before editing articles.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <p className="p-6 text-sm text-text-secondary">Loading article…</p>
  }

  if (loadError) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-status-error">{loadError}</p>
        <Link to="/content/articles" className="text-sm text-text-link">
          Back to articles
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/content/articles" className="text-sm text-text-link">
          ← Articles
        </Link>
        <div className="flex gap-2">
          {!isNew && articleId ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isDeleting}
              onClick={() => {
                void onDelete()
              }}
            >
              Delete
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => {
              void onSave()
            }}
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {saveError ? <p className="text-sm text-status-error">{saveError}</p> : null}
      {deleteError ? <p className="text-sm text-status-error">{deleteError}</p> : null}

      <Card className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor={titleFieldId}>Title</Label>
          <Input
            id={titleFieldId}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={slugFieldId}>Slug</Label>
          <Input
            id={slugFieldId}
            value={slug}
            onChange={(e) => {
              setSlugManual(true)
              setSlug(e.target.value)
            }}
            autoComplete="off"
          />
          <p className="text-xs text-text-secondary">
            Auto-generated from the title until you edit this field (Nordic transliteration
            matches the server).
          </p>
        </div>

        <div className="space-y-2">
          <Label>Body</Label>
          <RichTextEditor value={body} onChange={setBody} />
        </div>

        <Switch
          id={statusSwitchId}
          checked={status === "published"}
          onCheckedChange={(checked) => {
            setStatus(checked ? "published" : "draft")
          }}
          label={status === "published" ? "Published" : "Draft"}
        />

        {status === "published" ? (
          <div className="space-y-2">
            <Label htmlFor={publishedFieldId}>Publish date</Label>
            <Input
              id={publishedFieldId}
              type="datetime-local"
              value={publishedLocal}
              onChange={(e) => {
                setPublishedLocal(e.target.value)
              }}
            />
            <p className="text-xs text-text-secondary">
              Leave empty to use the current time when you save as published.
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
