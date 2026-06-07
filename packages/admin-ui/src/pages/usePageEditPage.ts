import { useCallback, useEffect, useReducer, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"

import {
  createCmsPage,
  deleteCmsPage,
  fetchCmsPageById,
  patchCmsPage,
} from "@/features/cms-pages/cmsPagesAdminApi"
import { slugifyCategoryHandle } from "@/features/product-categories/slugifyCategoryHandle"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { pageEditReducer } from "./pageEditState"

export function usePageEditPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const navigate = useNavigate()
  const isNew = pageId === "new"
  const slugTouchedRef = useRef(false)

  const [state, dispatch] = useReducer(pageEditReducer, {
    title: "",
    slug: "",
    pageType: "content",
    status: "draft",
    blockCount: null,
    loadError: null,
    saveError: null,
    isLoading: !isNew,
    isSaving: false,
  })

  useEffect(() => {
    if (isNew || !pageId) {
      dispatch({ type: "initNew" })
      return
    }

    const base = resolveMedusaAdminBackendUrl()
    if (base === null) {
      dispatch({ type: "loadError", message: "Missing VITE_MEDUSA_ADMIN_BACKEND_URL." })
      return
    }

    dispatch({ type: "loadStart" })
    void (async (): Promise<void> => {
      try {
        const row = await fetchCmsPageById(pageId)
        if (!row) {
          dispatch({ type: "loadError", message: "Page not found." })
          return
        }
        slugTouchedRef.current = true
        dispatch({
          type: "loadSuccess",
          payload: {
            title: row.title,
            slug: row.slug,
            pageType: row.page_type,
            status: row.status,
            blockCount: row.block_count,
          },
        })
      } catch (e) {
        dispatch({
          type: "loadError",
          message: e instanceof Error ? e.message : "Unable to load page.",
        })
      } finally {
        dispatch({ type: "loadFinish" })
      }
    })()
  }, [isNew, pageId])

  const onTitleChange = useCallback((value: string): void => {
    dispatch({ type: "setTitle", value })
    if (!slugTouchedRef.current) {
      dispatch({ type: "setSlug", value: slugifyCategoryHandle(value) })
    }
  }, [])

  const onSlugChange = useCallback((value: string): void => {
    slugTouchedRef.current = true
    dispatch({ type: "setSlug", value })
  }, [])

  const onSave = useCallback((): void => {
    const base = resolveMedusaAdminBackendUrl()
    if (base === null) {
      dispatch({ type: "saveError", message: "Missing VITE_MEDUSA_ADMIN_BACKEND_URL." })
      return
    }
    if (!state.title.trim() || !state.slug.trim()) {
      dispatch({ type: "saveError", message: "Title and slug are required." })
      return
    }

    dispatch({ type: "saveStart" })
    void (async (): Promise<void> => {
      try {
        if (isNew || !pageId) {
          const created = await createCmsPage({
            title: state.title.trim(),
            slug: state.slug.trim(),
            page_type: state.pageType,
            status: state.status,
            locale: "en",
          })
          navigate(`/content/pages/${encodeURIComponent(created.id)}`, { replace: true })
          return
        }
        const updated = await patchCmsPage(pageId, {
          title: state.title.trim(),
          slug: state.slug.trim(),
          page_type: state.pageType,
          status: state.status,
        })
        dispatch({
          type: "saveSuccess",
          payload: {
            title: updated.title,
            slug: updated.slug,
            pageType: updated.page_type,
            status: updated.status,
            blockCount: updated.block_count,
          },
        })
      } catch (e) {
        dispatch({
          type: "saveError",
          message: e instanceof Error ? e.message : "Save failed.",
        })
      } finally {
        dispatch({ type: "saveFinish" })
      }
    })()
  }, [isNew, navigate, pageId, state.pageType, state.slug, state.status, state.title])

  const onDelete = useCallback((): void => {
    if (isNew || !pageId) {
      return
    }
    if (!window.confirm("Delete this page? This can be restored only from the database layer.")) {
      return
    }
    dispatch({ type: "saveStart" })
    void (async (): Promise<void> => {
      try {
        await deleteCmsPage(pageId)
        navigate("/content/pages")
      } catch (e) {
        dispatch({
          type: "saveError",
          message: e instanceof Error ? e.message : "Delete failed.",
        })
      } finally {
        dispatch({ type: "saveFinish" })
      }
    })()
  }, [isNew, navigate, pageId])

  return {
    isNew,
    state,
    dispatch,
    onTitleChange,
    onSlugChange,
    onSave,
    onDelete,
  }
}
