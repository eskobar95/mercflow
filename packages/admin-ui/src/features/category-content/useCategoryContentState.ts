import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_CATEGORY_CONTENT_LOCALE,
  getCategoryContent,
  saveCategoryContent,
} from "./categoryContentApi"
import type { CategoryContentResolved, SaveCategoryContentBody } from "./types"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred"
}

export type UseCategoryContentStateOptions = {
  categoryId: string
  /** Active locale for read/write; defaults to `en` to match the API. */
  locale?: string
  /** When true (default), loads once when `categoryId` / `locale` change. */
  loadOnMount?: boolean
}

export type UseCategoryContentStateResult = {
  content: CategoryContentResolved | null
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

  const [content, setContent] = useState<CategoryContentResolved | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setLoadError(null)
    try {
      const next = await getCategoryContent(options.categoryId, locale)
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
      try {
        const next = await saveCategoryContent(options.categoryId, body, locale)
        setContent(next)
        return true
      } catch (e: unknown) {
        setSaveError(toErrorMessage(e))
        return false
      } finally {
        setSaving(false)
      }
    },
    [options.categoryId, locale]
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
