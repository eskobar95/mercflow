import { useCallback, useMemo } from "react"

import { useAdminAuthReady } from "@/components/auth/AdminAuthReadyContext"
import { useAdminLocales, useContentLocale } from "@/features/content-locale"
import { readPersistedContentLocale } from "@/features/content-locale/persistContentLocale"
import {
  DEFAULT_PRODUCT_CONTENT_LOCALE,
  useProductContentState,
} from "@/features/product-content"
import { preferProductContentLocale } from "@/features/product-content/preferProductContentLocale"

type UseProductContentTabOptions = {
  productId: string
}

export function useProductContentTab({ productId }: UseProductContentTabOptions) {
  const isAdminAuthReady = useAdminAuthReady()
  const { locales, loading: localesLoading, error: localesError } = useAdminLocales()
  const persistedLocale = useMemo(() => readPersistedContentLocale(productId), [productId])
  const preferredLocale = useMemo((): string => {
    if (
      persistedLocale !== null &&
      locales.some((locale) => locale.code === persistedLocale)
    ) {
      return persistedLocale
    }
    return preferProductContentLocale(locales, DEFAULT_PRODUCT_CONTENT_LOCALE)
  }, [locales, persistedLocale])
  const { activeLocaleCode, editingLocaleCode, setActiveLocaleCode } = useContentLocale({
    locales,
    preferredCode: preferredLocale,
    initialLocaleCode: persistedLocale,
  })

  const localeCodes = useMemo(() => locales.map((locale) => locale.code), [locales])

  const { content, loading, saving, loadError, saveError, save, load, clearError } =
    useProductContentState({
      productId,
      locale: editingLocaleCode,
      localeFallbacks: localeCodes,
      onResolvedLocale: setActiveLocaleCode,
      loadOnMount: isAdminAuthReady && !localesLoading,
    })

  const formBootstrapKey =
    loading || content === null
      ? null
      : `${editingLocaleCode}:${content.id}:${content.version}`

  const bannerError = loadError ?? saveError
  const disabled = loading || saving

  const onAddContent = useCallback(async (): Promise<void> => {
    clearError()
    void save({
      description_rich: { type: "doc", content: [] },
      seo_title: null,
      seo_description: null,
      seo_og_image_id: null,
      canonical_url_override: null,
      media_gallery: null,
    })
  }, [clearError, save])

  const onRetryLoad = useCallback(async (): Promise<void> => {
    clearError()
    await load()
  }, [clearError, load])

  return {
    locales,
    localesLoading,
    localesError,
    activeLocaleCode,
    editingLocaleCode,
    setActiveLocaleCode,
    content,
    loading,
    saving,
    bannerError,
    disabled,
    formBootstrapKey,
    save,
    load,
    clearError,
    onAddContent,
    onRetryLoad,
  }
}
