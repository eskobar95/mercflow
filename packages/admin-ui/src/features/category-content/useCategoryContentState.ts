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
  error: string | null
  load: () => Promise<void>
  save: (body: SaveCategoryContentBody) => Promise<void>
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
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const next = await getCategoryContent(options.categoryId, locale)
      setContent(next)
    } catch (e: unknown) {
      setError(toErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [options.categoryId, locale])

  const save = useCallback(
    async (body: SaveCategoryContentBody): Promise<void> => {
      setSaving(true)
      setError(null)
      try {
        const next = await saveCategoryContent(options.categoryId, body, locale)
        setContent(next)
      } catch (e: unknown) {
        setError(toErrorMessage(e))
      } finally {
        setSaving(false)
      }
    },
    [options.categoryId, locale]
  )

  const clearError = useCallback((): void => {
    setError(null)
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
    error,
    load,
    save,
    clearError,
  }
}
