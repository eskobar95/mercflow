import { useCallback, useMemo, useReducer, useRef, useState } from "react"

import { useAdminLocales, useContentLocale } from "@/features/content-locale"
import {
  DEFAULT_PRODUCT_CONTENT_LOCALE,
  useProductContentState,
} from "@/features/product-content"
import { preferProductContentLocale } from "@/features/product-content/preferProductContentLocale"
import { EMPTY_TIPTAP_DOC, tiptapDocFromUnknown } from "@/lib/tiptap"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

import { isProductContentDirty } from "./productContentDirty"
import {
  INITIAL_PRODUCT_CONTENT_FORM_STATE,
  productContentFormReducer,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
} from "./productContentFormState"

type UseProductContentTabOptions = {
  productId: string
}

export function useProductContentTab({ productId }: UseProductContentTabOptions) {
  const { locales, loading: localesLoading, error: localesError } = useAdminLocales()
  const preferredLocale = preferProductContentLocale(locales, DEFAULT_PRODUCT_CONTENT_LOCALE)
  const { activeLocaleCode, setActiveLocaleCode } = useContentLocale({
    locales,
    preferredCode: preferredLocale,
  })
  const pendingLocaleRef = useRef<string | null>(null)
  const [localeDialogOpen, setLocaleDialogOpen] = useState(false)

  const { content, loading, saving, loadError, saveError, save, load, clearError } =
    useProductContentState({
      productId,
      locale: activeLocaleCode,
      loadOnMount: true,
    })

  const [form, dispatchForm] = useReducer(
    productContentFormReducer,
    INITIAL_PRODUCT_CONTENT_FORM_STATE,
  )
  const { descriptionJson, seoTitle, seoDescription, ogUrl, canonicalUrl, validationError } = form

  const contentSyncKey =
    loading || content === null ? null : `${content.id}:${content.version ?? 0}`

  useAdjustStateWhenKeyChanges(contentSyncKey, () => {
    if (content === null) {
      return
    }
    dispatchForm({
      type: "syncFromServer",
      payload: {
        descriptionJson: tiptapDocFromUnknown(content.body_json),
        seoTitle: content.seo_title ?? "",
        seoDescription: content.seo_description ?? "",
        ogUrl: content.og_image_url ?? "",
        canonicalUrl: content.canonical_url_override ?? "",
        validationError: null,
      },
    })
  })

  const isDirty = useMemo(
    () =>
      content !== null &&
      isProductContentDirty(content, {
        descriptionJson,
        seoTitle,
        seoDescription,
        ogImageUrl: ogUrl,
        canonicalUrlOverride: canonicalUrl,
      }),
    [content, descriptionJson, seoTitle, seoDescription, ogUrl, canonicalUrl],
  )

  const bannerError = validationError ?? loadError ?? saveError
  const seoTitleTooLong = seoTitle.length > SEO_TITLE_MAX
  const seoDescriptionTooLong = seoDescription.length > SEO_DESCRIPTION_MAX
  const disabled = loading || saving

  const onAddContent = useCallback(async (): Promise<void> => {
    clearError()
    void save({
      description_rich: EMPTY_TIPTAP_DOC,
      seo_title: null,
      seo_description: null,
      seo_og_image_id: null,
      canonical_url_override: null,
      media_gallery: null,
    })
  }, [clearError, save])

  const onDiscard = useCallback(async (): Promise<void> => {
    dispatchForm({ type: "setValidationError", value: null })
    clearError()
    await load()
  }, [clearError, load])

  const runSave = useCallback(async (): Promise<boolean> => {
    clearError()
    if (seoTitleTooLong || seoDescriptionTooLong) {
      dispatchForm({
        type: "setValidationError",
        value: seoTitleTooLong
          ? `Meta title must be at most ${SEO_TITLE_MAX} characters (currently ${seoTitle.length}).`
          : `SEO description must be at most ${SEO_DESCRIPTION_MAX} characters (currently ${seoDescription.length}).`,
      })
      return false
    }
    dispatchForm({ type: "setValidationError", value: null })
    return save({
      description_rich: descriptionJson,
      seo_title: seoTitle.trim() === "" ? null : seoTitle.trim(),
      seo_description: seoDescription.trim() === "" ? null : seoDescription.trim(),
      seo_og_image_id: ogUrl.trim() === "" ? null : ogUrl.trim(),
      canonical_url_override: canonicalUrl.trim() === "" ? null : canonicalUrl.trim(),
      media_gallery: null,
    })
  }, [
    clearError,
    canonicalUrl,
    descriptionJson,
    ogUrl,
    save,
    seoDescription,
    seoTitle,
    seoTitleTooLong,
    seoDescriptionTooLong,
  ])

  const onRetryLoad = useCallback(async (): Promise<void> => {
    clearError()
    await load()
  }, [clearError, load])

  const requestLocaleChange = useCallback(
    (code: string): void => {
      if (code === activeLocaleCode) {
        return
      }
      if (isDirty) {
        pendingLocaleRef.current = code
        setLocaleDialogOpen(true)
        return
      }
      setActiveLocaleCode(code)
    },
    [activeLocaleCode, isDirty, setActiveLocaleCode],
  )

  const closeLocaleDialog = useCallback((): void => {
    setLocaleDialogOpen(false)
    pendingLocaleRef.current = null
  }, [])

  const onSaveAndSwitchLocale = useCallback(async (): Promise<void> => {
    const target = pendingLocaleRef.current
    if (target === null) {
      return
    }
    const saved = await runSave()
    if (!saved) {
      return
    }
    closeLocaleDialog()
    setActiveLocaleCode(target)
  }, [closeLocaleDialog, runSave, setActiveLocaleCode])

  const onDiscardAndSwitchLocale = useCallback(async (): Promise<void> => {
    const target = pendingLocaleRef.current
    if (target === null) {
      return
    }
    clearError()
    const reloaded = await load()
    if (!reloaded) {
      return
    }
    closeLocaleDialog()
    setActiveLocaleCode(target)
  }, [clearError, closeLocaleDialog, load, setActiveLocaleCode])

  return {
    locales,
    localesLoading,
    localesError,
    activeLocaleCode,
    content,
    loading,
    saving,
    bannerError,
    descriptionJson,
    seoTitle,
    seoDescription,
    ogUrl,
    canonicalUrl,
    seoTitleTooLong,
    seoDescriptionTooLong,
    disabled,
    isDirty,
    localeDialogOpen,
    setLocaleDialogOpen,
    dispatchForm,
    onAddContent,
    onDiscard,
    runSave,
    onRetryLoad,
    requestLocaleChange,
    closeLocaleDialog,
    onSaveAndSwitchLocale,
    onDiscardAndSwitchLocale,
  }
}
