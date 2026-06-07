import type { JSONContent } from "@tiptap/core"
import type { ReactNode } from "react"
import { useCallback, useEffect, useId, useReducer, useRef } from "react"
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

type ArticleEditState = {
  loadError: string | null
  saveError: string | null
  deleteError: string | null
  isLoading: boolean
  isSaving: boolean
  isDeleting: boolean
  title: string
  slug: string
  body: JSONContent
  status: ArticleStatus
  publishedLocal: string
}

type ArticleEditAction =
  | { type: "loadIdle" }
  | { type: "loadStart" }
  | { type: "loadSuccess"; payload: Omit<ArticleEditState, "loadError" | "saveError" | "deleteError" | "isLoading" | "isSaving" | "isDeleting"> }
  | { type: "loadError"; message: string }
  | { type: "loadFinish" }
  | { type: "setTitle"; value: string }
  | { type: "setSlug"; value: string }
  | { type: "setBody"; value: JSONContent }
  | { type: "setStatus"; value: ArticleStatus }
  | { type: "setPublishedLocal"; value: string }
  | { type: "saveStart" }
  | { type: "saveError"; message: string }
  | { type: "saveFinish" }
  | { type: "deleteStart" }
  | { type: "deleteError"; message: string }
  | { type: "deleteFinish" }

function articleEditReducer(state: ArticleEditState, action: ArticleEditAction): ArticleEditState {
  switch (action.type) {
    case "loadIdle":
      return { ...state, isLoading: false }
    case "loadStart":
      return { ...state, isLoading: true, loadError: null }
    case "loadSuccess":
      return { ...state, ...action.payload, loadError: null }
    case "loadError":
      return { ...state, loadError: action.message }
    case "loadFinish":
      return { ...state, isLoading: false }
    case "setTitle":
      return { ...state, title: action.value }
    case "setSlug":
      return { ...state, slug: action.value }
    case "setBody":
      return { ...state, body: action.value }
    case "setStatus":
      return { ...state, status: action.value }
    case "setPublishedLocal":
      return { ...state, publishedLocal: action.value }
    case "saveStart":
      return { ...state, saveError: null, isSaving: true }
    case "saveError":
      return { ...state, saveError: action.message, isSaving: false }
    case "saveFinish":
      return { ...state, isSaving: false }
    case "deleteStart":
      return { ...state, deleteError: null, isDeleting: true }
    case "deleteError":
      return { ...state, deleteError: action.message, isDeleting: false }
    case "deleteFinish":
      return { ...state, isDeleting: false }
    default:
      return state
  }
}

export function ArticleEditPage(): ReactNode {
  const { articleId } = useParams<{ articleId: string }>()
  const navigate = useNavigate()
  const hasBackendConfiguration = resolveMedusaAdminBackendUrl() !== null
  const slugManualRef = useRef(false)

  const titleFieldId = useId()
  const slugFieldId = useId()
  const publishedFieldId = useId()
  const statusSwitchId = useId()

  const isNew = articleId === "new"

  const [state, dispatch] = useReducer(articleEditReducer, {
    loadError: null,
    saveError: null,
    deleteError: null,
    isLoading: !isNew,
    isSaving: false,
    isDeleting: false,
    title: "",
    slug: "",
    body: tiptapDocFromUnknown(null),
    status: "draft",
    publishedLocal: "",
  })

  const {
    loadError,
    saveError,
    deleteError,
    isLoading,
    isSaving,
    isDeleting,
    title,
    slug,
    body,
    status,
    publishedLocal,
  } = state

  const displaySlug = slugManualRef.current ? slug : slugifyTitleToArticleSegment(title)

  const load = useCallback(async (): Promise<void> => {
    if (!hasBackendConfiguration || isNew || !articleId) {
      dispatch({ type: "loadIdle" })
      return
    }
    dispatch({ type: "loadStart" })
    try {
      const row = await getArticleAdmin(articleId)
      slugManualRef.current = true
      dispatch({
        type: "loadSuccess",
        payload: {
          title: row.title,
          slug: row.slug,
          body: tiptapDocFromUnknown(row.body_json),
          status: row.status,
          publishedLocal: toDatetimeLocalValue(row.published_at),
        },
      })
    } catch (e) {
      dispatch({
        type: "loadError",
        message: e instanceof Error ? e.message : "Failed to load article",
      })
    } finally {
      dispatch({ type: "loadFinish" })
    }
  }, [articleId, hasBackendConfiguration, isNew])

  useEffect(() => {
    void load()
  }, [load])

  const onSave = useCallback(async (): Promise<void> => {
    if (!hasBackendConfiguration) {
      return
    }
    dispatch({ type: "saveStart" })
    try {
      const publishedAtIso =
        status === "published"
          ? publishedLocal.trim() === ""
            ? undefined
            : new Date(publishedLocal).toISOString()
          : null

      const payload = {
        title: title.trim(),
        slug: displaySlug.trim() === "" ? null : displaySlug.trim(),
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
          dispatch({ type: "saveError", message: "Missing article id" })
          return
        }
        await updateArticleAdmin(articleId, payload)
        await load()
      }
    } catch (e) {
      dispatch({
        type: "saveError",
        message: e instanceof Error ? e.message : "Save failed",
      })
    } finally {
      dispatch({ type: "saveFinish" })
    }
  }, [
    articleId,
    body,
    displaySlug,
    hasBackendConfiguration,
    isNew,
    load,
    navigate,
    publishedLocal,
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
    dispatch({ type: "deleteStart" })
    try {
      await deleteArticleAdmin(articleId)
      navigate("/content/articles")
    } catch (e) {
      dispatch({
        type: "deleteError",
        message: e instanceof Error ? e.message : "Delete failed",
      })
    } finally {
      dispatch({ type: "deleteFinish" })
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
              dispatch({ type: "setTitle", value: e.target.value })
            }}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={slugFieldId}>Slug</Label>
          <Input
            id={slugFieldId}
            value={displaySlug}
            onChange={(e) => {
              slugManualRef.current = true
              dispatch({ type: "setSlug", value: e.target.value })
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
          <RichTextEditor
            value={body}
            onChange={(value) => {
              dispatch({ type: "setBody", value })
            }}
          />
        </div>

        <Switch
          id={statusSwitchId}
          checked={status === "published"}
          onCheckedChange={(checked) => {
            dispatch({ type: "setStatus", value: checked ? "published" : "draft" })
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
                dispatch({ type: "setPublishedLocal", value: e.target.value })
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
