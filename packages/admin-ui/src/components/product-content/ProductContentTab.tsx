import { type ReactNode, useId } from "react"

import { ProductContentEmptyView } from "./ProductContentEmptyView"
import { ProductContentTabFormController } from "./ProductContentTabFormController"
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
  } = controller

  const statusView = renderProductContentTabStatus({
    localesLoading,
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
        localesWarning={localesError}
        onLocaleChange={setActiveLocaleCode}
        onAddContent={() => {
          void onAddContent()
        }}
      />
    )
  }

  return (
    <ProductContentTabFormController
      key={formBootstrapKey ?? "loading"}
      formId={formId}
      productId={productId}
      content={content}
      editingLocaleCode={editingLocaleCode}
      locales={locales}
      activeLocaleCode={activeLocaleCode}
      localesLoading={localesLoading}
      localesWarning={localesError}
      saving={saving}
      disabled={disabled}
      bannerError={bannerError}
      productTitleFallback={productTitleFallback}
      setActiveLocaleCode={setActiveLocaleCode}
      save={save}
      load={load}
      clearError={clearError}
    />
  )
}
