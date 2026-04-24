import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_PRODUCT_CONTENT_LOCALE,
  getProductContent,
  saveProductContent,
} from "./productContentApi"
import type { ProductContentResolved, SaveProductContentBody } from "./types"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred"
}

export type UseProductContentStateOptions = {
  productId: string
  /** Active locale for read/write; defaults to `en` to match the API. */
  locale?: string
  /** When true (default), loads once when `productId` / `locale` change. */
  loadOnMount?: boolean
}

export type UseProductContentStateResult = {
  content: ProductContentResolved | null
  loading: boolean
  saving: boolean
  error: string | null
  load: () => Promise<void>
  save: (body: SaveProductContentBody) => Promise<void>
  clearError: () => void
}

export function useProductContentState(
  options: UseProductContentStateOptions
): UseProductContentStateResult {
  const locale = options.locale ?? DEFAULT_PRODUCT_CONTENT_LOCALE
  const loadOnMount = options.loadOnMount ?? true

  const [content, setContent] = useState<ProductContentResolved | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const next = await getProductContent(options.productId, locale)
      setContent(next)
    } catch (e: unknown) {
      setError(toErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [options.productId, locale])

  const save = useCallback(
    async (body: SaveProductContentBody): Promise<void> => {
      setSaving(true)
      setError(null)
      try {
        const next = await saveProductContent(options.productId, body, locale)
        setContent(next)
      } catch (e: unknown) {
        setError(toErrorMessage(e))
      } finally {
        setSaving(false)
      }
    },
    [options.productId, locale]
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
