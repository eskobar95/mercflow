import { useCallback, useEffect, useRef, useState } from "react"

import {
  DEFAULT_PRODUCT_CONTENT_LOCALE,
  getProductContentWithLocaleFallback,
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
    canonical_url_override:
      body.canonical_url_override !== undefined
        ? body.canonical_url_override
        : snapshot.canonical_url_override,
    version: snapshot.version + 1,
  }
}

export type UseProductContentStateOptions = {
  productId: string
  /** Active locale for read/write; defaults to `en` to match the API. */
  locale?: string
  /** Other store locale codes to probe when the active locale has no CMS row. */
  localeFallbacks?: readonly string[]
  /** Called when content is found under a different locale than requested. */
  onResolvedLocale?: (locale: string) => void
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
  const localeFallbacks = options.localeFallbacks ?? []
  const onResolvedLocale = options.onResolvedLocale

  const [content, setContent] = useState<ProductContentReadPayload | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const loadGenerationRef = useRef(0)
  const saveGenerationRef = useRef(0)
  const skipLoadForLocaleRef = useRef<string | null>(null)

  const load = useCallback(async (): Promise<boolean> => {
    const generation = ++loadGenerationRef.current
    setLoading(true)
    setLoadError(null)
    setContent(null)
    try {
      const resolved = await getProductContentWithLocaleFallback(
        options.productId,
        locale,
        localeFallbacks
      )
      if (generation !== loadGenerationRef.current) {
        return false
      }
      if (resolved.locale !== locale) {
        skipLoadForLocaleRef.current = resolved.locale
        onResolvedLocale?.(resolved.locale)
      }
      setContent(resolved.content)
      return true
    } catch (e: unknown) {
      if (generation !== loadGenerationRef.current) {
        return false
      }
      setLoadError(toErrorMessage(e))
      return false
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoading(false)
      }
    }
  }, [locale, localeFallbacks, onResolvedLocale, options.productId])

  const save = useCallback(
    async (body: SaveProductContentBody): Promise<boolean> => {
      const generation = ++saveGenerationRef.current
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
        if (generation !== saveGenerationRef.current) {
          return false
        }
        setContent(next)
        return true
      } catch (e: unknown) {
        if (generation !== saveGenerationRef.current) {
          return false
        }
        if (snapshot !== null) {
          setContent(snapshot)
        }
        setSaveError(toErrorMessage(e))
        return false
      } finally {
        if (generation === saveGenerationRef.current) {
          setSaving(false)
        }
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
    if (skipLoadForLocaleRef.current === locale) {
      skipLoadForLocaleRef.current = null
      return
    }
    void load()
  }, [load, loadOnMount, locale])

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
