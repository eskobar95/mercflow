import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_CATEGORY_CONTENT_LOCALE,
  getCategoryContentRead,
  saveCategoryContent,
} from "./categoryContentApi"
import type { CategoryContentReadPayload, SaveCategoryContentBody } from "./types"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred"
}

function mergeOptimisticCategoryPayload(
  snapshot: CategoryContentReadPayload,
  body: SaveCategoryContentBody
): CategoryContentReadPayload {
  return {
    ...snapshot,
    body_json:
      body.description_rich !== undefined ? body.description_rich : snapshot.body_json,
    seo_title: body.seo_title !== undefined ? body.seo_title : snapshot.seo_title,
    seo_description:
      body.seo_description !== undefined ? body.seo_description : snapshot.seo_description,
    og_image_url:
      body.seo_og_image_id !== undefined ? body.seo_og_image_id : snapshot.og_image_url,
    banner_image_url:
      body.banner_image_id !== undefined ? body.banner_image_id : snapshot.banner_image_url,
    version: snapshot.version + 1,
  }
}

type UseCategoryContentStateOptions = {
  categoryId: string
  /** Active locale for read/write; defaults to `en` to match the API. */
  locale?: string
  /** When true (default), loads once when `categoryId` / `locale` change. */
  loadOnMount?: boolean
}

type UseCategoryContentStateResult = {
  content: CategoryContentReadPayload | null
  loading: boolean
  saving: boolean
  loadError: string | null
  saveError: string | null
  load: () => Promise<boolean>
  save: (body: SaveCategoryContentBody) => Promise<boolean>
  clearError: () => void
}

export function useCategoryContentState(
  options: UseCategoryContentStateOptions
): UseCategoryContentStateResult {
  const locale = options.locale ?? DEFAULT_CATEGORY_CONTENT_LOCALE
  const loadOnMount = options.loadOnMount ?? true

  const [content, setContent] = useState<CategoryContentReadPayload | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setLoadError(null)
    try {
      const next = await getCategoryContentRead(options.categoryId, locale)
      setContent(next)
      return true
    } catch (e: unknown) {
      setLoadError(toErrorMessage(e))
      return false
    } finally {
      setLoading(false)
    }
  }, [options.categoryId, locale])

  const save = useCallback(
    async (body: SaveCategoryContentBody): Promise<boolean> => {
      setSaving(true)
      setSaveError(null)
      const snapshot = content

      try {
        if (snapshot !== null) {
          setContent(mergeOptimisticCategoryPayload(snapshot, body))
        }

        const next = await saveCategoryContent({
          categoryId: options.categoryId,
          cmsContentId: snapshot?.id ?? null,
          body,
          locale,
        })
        setContent(next)
        return true
      } catch (e: unknown) {
        if (snapshot !== null) {
          setContent(snapshot)
        }
        setSaveError(toErrorMessage(e))
        return false
      } finally {
        setSaving(false)
      }
    },
    [content, locale, options.categoryId]
  )

  const clearError = useCallback((): void => {
    setLoadError(null)
    setSaveError(null)
  }, [])

  useEffect(() => {
    if (!loadOnMount) {
      return
    }
    void load()
  }, [load, loadOnMount])

  return {
    content,
    loading,
    saving,
    loadError,
    saveError,
    load,
    save,
    clearError,
  }
}
