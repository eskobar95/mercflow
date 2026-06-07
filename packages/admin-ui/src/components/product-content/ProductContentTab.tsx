import { type ReactNode, useId } from "react"

import { ProductContentEmptyView } from "./ProductContentEmptyView"
import { ProductContentTabForm } from "./ProductContentTabForm"
import { renderProductContentTabStatus } from "./ProductContentTabStatusViews"
import { useProductContentTab } from "./useProductContentTab"

export type ProductContentTabProps = {
  productId: string
  /** Used when meta title is empty in previews */
  productTitleFallback: string
}

export function ProductContentTab({
  productId,
  productTitleFallback,
}: ProductContentTabProps): ReactNode {
  const formId = useId()
  const controller = useProductContentTab({ productId })

  const {
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
  } = controller

  const statusView = renderProductContentTabStatus({
    localesLoading,
    localesError,
    loading,
    bannerError,
    contentIsNull: content === null,
    onRetryLoad: () => {
      void onRetryLoad()
    },
  })

  if (statusView !== null) {
    return statusView
  }

  if (content === null) {
    return (
      <ProductContentEmptyView
        locales={locales}
        activeLocaleCode={activeLocaleCode}
        saving={saving}
        localesLoading={localesLoading}
        localeDialogOpen={localeDialogOpen}
        onLocaleDialogOpenChange={setLocaleDialogOpen}
        requestLocaleChange={requestLocaleChange}
        onAddContent={() => {
          void onAddContent()
        }}
        onSaveAndSwitchLocale={onSaveAndSwitchLocale}
        onDiscardAndSwitchLocale={onDiscardAndSwitchLocale}
        closeLocaleDialog={closeLocaleDialog}
      />
    )
  }

  const seoPreviewTitle =
    seoTitle.trim() !== "" ? seoTitle : productTitleFallback.trim() !== "" ? productTitleFallback : ""

  return (
    <ProductContentTabForm
      formId={formId}
      content={content}
      locales={locales}
      activeLocaleCode={activeLocaleCode}
      localesLoading={localesLoading}
      saving={saving}
      disabled={disabled}
      bannerError={bannerError}
      descriptionJson={descriptionJson}
      seoTitle={seoTitle}
      seoDescription={seoDescription}
      ogUrl={ogUrl}
      canonicalUrl={canonicalUrl}
      seoTitleTooLong={seoTitleTooLong}
      seoDescriptionTooLong={seoDescriptionTooLong}
      isDirty={isDirty}
      seoPreviewTitle={seoPreviewTitle}
      productTitleFallback={productTitleFallback}
      localeDialogOpen={localeDialogOpen}
      onLocaleDialogOpenChange={setLocaleDialogOpen}
      requestLocaleChange={requestLocaleChange}
      runSave={runSave}
      onDiscard={onDiscard}
      onSaveAndSwitchLocale={onSaveAndSwitchLocale}
      onDiscardAndSwitchLocale={onDiscardAndSwitchLocale}
      closeLocaleDialog={closeLocaleDialog}
      dispatchForm={dispatchForm}
    />
  )
}
