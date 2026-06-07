import { type ReactNode, useCallback, useId, useMemo, useReducer } from "react"

import { useAdminLocales } from "@/features/content-locale"
import {
  DEFAULT_CATEGORY_CONTENT_LOCALE,
  useCategoryContentState,
} from "@/features/category-content"
import { preferCategoryContentLocale } from "@/features/category-content/preferCategoryContentLocale"
import { EMPTY_TIPTAP_DOC, tiptapDocFromUnknown } from "@/lib/tiptap"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

import { isCategoryContentDirty } from "./categoryContentDirty"
import {
  categoryContentFormReducer,
  INITIAL_CATEGORY_CONTENT_FORM_STATE,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
} from "./categoryContentFormState"
import { CategoryContentTabForm } from "./CategoryContentTabForm"
import { renderCategoryContentTabStatus } from "./CategoryContentTabStatusViews"

export type CategoryContentTabProps = {
  categoryId: string
  /** Used when meta title is empty in previews */
  categoryTitleFallback: string
}

export function CategoryContentTab({
  categoryId,
  categoryTitleFallback,
}: CategoryContentTabProps): ReactNode {
  const formId = useId()
  const { locales, loading: localesLoading, error: localesError } = useAdminLocales()
  const readLocale = preferCategoryContentLocale(locales, DEFAULT_CATEGORY_CONTENT_LOCALE)

  const { content, loading, saving, loadError, saveError, save, load, clearError } =
    useCategoryContentState({
      categoryId,
      locale: readLocale,
      loadOnMount: true,
    })

  const [form, dispatchForm] = useReducer(
    categoryContentFormReducer,
    INITIAL_CATEGORY_CONTENT_FORM_STATE,
  )
  const { descriptionJson, seoTitle, seoDescription, ogUrl, bannerUrl, validationError } = form

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
        bannerUrl: content.banner_image_url ?? "",
        validationError: null,
      },
    })
  })

  const isDirty = useMemo(
    () =>
      content !== null &&
      isCategoryContentDirty(content, {
        descriptionJson,
        seoTitle,
        seoDescription,
        ogImageUrl: ogUrl,
        bannerImageUrl: bannerUrl,
      }),
    [content, descriptionJson, seoTitle, seoDescription, ogUrl, bannerUrl]
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
      banner_image_id: null,
    })
  }, [clearError, save])

  const onDiscard = useCallback(async () => {
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
      banner_image_id: bannerUrl.trim() === "" ? null : bannerUrl.trim(),
    })
  }, [
    bannerUrl,
    clearError,
    descriptionJson,
    ogUrl,
    save,
    seoDescription,
    seoDescriptionTooLong,
    seoTitle,
    seoTitleTooLong,
  ])

  const onRetryLoad = useCallback(async () => {
    clearError()
    await load()
  }, [clearError, load])

  const statusView = renderCategoryContentTabStatus({
    localesLoading,
    localesError,
    loading,
    bannerError,
    contentIsNull: content === null,
    readLocale,
    saving,
    onRetryLoad: () => {
      void onRetryLoad()
    },
    onAddContent: () => {
      void onAddContent()
    },
  })

  if (statusView !== null) {
    return statusView
  }

  if (content === null) {
    return null
  }

  const seoPreviewTitle =
    seoTitle.trim() !== ""
      ? seoTitle
      : categoryTitleFallback.trim() !== ""
        ? categoryTitleFallback
        : ""

  return (
    <CategoryContentTabForm
      formId={formId}
      content={content}
      saving={saving}
      disabled={disabled}
      bannerError={bannerError}
      descriptionJson={descriptionJson}
      seoTitle={seoTitle}
      seoDescription={seoDescription}
      ogUrl={ogUrl}
      bannerUrl={bannerUrl}
      seoTitleTooLong={seoTitleTooLong}
      seoDescriptionTooLong={seoDescriptionTooLong}
      isDirty={isDirty}
      seoPreviewTitle={seoPreviewTitle}
      categoryTitleFallback={categoryTitleFallback}
      runSave={runSave}
      onDiscard={onDiscard}
      dispatchForm={dispatchForm}
    />
  )
}
