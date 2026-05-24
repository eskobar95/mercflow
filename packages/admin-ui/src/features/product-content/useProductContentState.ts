import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_PRODUCT_CONTENT_LOCALE,
  getProductContent,
  saveProductContent,
} from "./productContentApi"
import type { ProductContentReadPayload, SaveProductContentBody } from "./types"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred"
}

function mergeOptimisticServerPayload(
  snapshot: ProductContentReadPayload,
  body: SaveProductContentBody
): ProductContentReadPayload {
  return {
    ...snapshot,
    body_json:
      body.description_rich !== undefined ? body.description_rich : snapshot.body_json,
    seo_title: body.seo_title !== undefined ? body.seo_title : snapshot.seo_title,
    seo_description:
      body.seo_description !== undefined ? body.seo_description : snapshot.seo_description,
    og_image_url:
      body.seo_og_image_id !== undefined ? body.seo_og_image_id : snapshot.og_image_url,
    version: snapshot.version + 1,
  }
}

export type UseProductContentStateOptions = {
  productId: string
  /** Active locale for read/write; defaults to `en` to match the API. */
  locale?: string
  /** When true (default), loads once when `productId` / `locale` change. */
  loadOnMount?: boolean
}

export type UseProductContentStateResult = {
  content: ProductContentReadPayload | null
  loading: boolean
  saving: boolean
  loadError: string | null
  saveError: string | null
  load: () => Promise<boolean>
  save: (body: SaveProductContentBody) => Promise<boolean>
  clearError: () => void
}

export function useProductContentState(
  options: UseProductContentStateOptions
): UseProductContentStateResult {
  const locale = options.locale ?? DEFAULT_PRODUCT_CONTENT_LOCALE
  const loadOnMount = options.loadOnMount ?? true

  const [content, setContent] = useState<ProductContentReadPayload | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setLoadError(null)
    try {
      const next = await getProductContent(options.productId, locale)
      setContent(next)
      return true
    } catch (e: unknown) {
      setLoadError(toErrorMessage(e))
      return false
    } finally {
      setLoading(false)
    }
  }, [options.productId, locale])

  const save = useCallback(
    async (body: SaveProductContentBody): Promise<boolean> => {
      setSaving(true)
      setSaveError(null)
      const snapshot = content

      try {
        if (snapshot !== null) {
          setContent(mergeOptimisticServerPayload(snapshot, body))
        }

        const next = await saveProductContent({
          productId: options.productId,
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
    [content, locale, options.productId]
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
