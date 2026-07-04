import { useQuery } from "@tanstack/react-query"
import type { AdminProduct } from "@medusajs/types"
import { type ReactNode, type FormEvent, useId, useMemo, useRef } from "react"
import { Link } from "react-router-dom"

import { useUnsavedFormGuard } from "@/lib/react/useUnsavedFormGuard"

import { ProductCategoryMetafieldsSection } from "@/components/metafields/ProductCategoryMetafieldsSection"
import { ProductMetafieldsSection } from "@/components/metafields/ProductMetafieldsSection"
import { useProductFormMetafields } from "@/components/metafields/useProductFormMetafields"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"

import {
  UnifiedFormValidationError,
  useUnifiedCatalogProductForm,
} from "@/hooks/products/useUnifiedCatalogProductForm"
import type { UnifiedCatalogProductShippingContext } from "@/hooks/products/useUnifiedCatalogProductForm"
import { useUnifiedCatalogProductShipping } from "@/hooks/products/useUnifiedCatalogProductShipping"

import { ADMIN_PRODUCT_EDITOR_FIELDS } from "@/lib/products/adminProductEditorFields"
import {
  buildCatalogEditFormBootstrap,
  type CatalogEditFormBootstrap,
} from "@/lib/products/productFormHydration"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

import { useClubPricingSection } from "@/features/subscriptions/useClubPricingSection"

import { ProductClubPricingSection } from "./ProductClubPricingSection"
import { UnifiedProductDetailsSection } from "./UnifiedProductDetailsSection"
import { UnifiedProductPricingSection } from "./UnifiedProductPricingSection"
import { UnifiedProductShippingSection } from "./UnifiedProductShippingSection"
import { UnifiedProductVariantMatrixSection } from "./UnifiedProductVariantMatrixSection"
import { formatFieldErrorsIntoMessage } from "./unifiedProductFormUtils"

type Props = {
  mode: "create" | "edit"
  productId?: string
}

type UnifiedProductFormSurfaceProps = {
  mode: "create" | "edit"
  productId?: string
  editBootstrap?: CatalogEditFormBootstrap
  hydratedProduct?: AdminProduct
}

export function UnifiedProductForm({ mode, productId }: Props): ReactNode {
  if (mode === "edit") {
    if (productId === undefined || productId.trim() === "") {
      return (
        <div className="p-4 md:p-6">
          <p className="text-sm text-feedback-danger-content" role="alert">
            Missing product id for edit.
          </p>
        </div>
      )
    }

    return <UnifiedProductFormEditLoader productId={productId} />
  }

  return <UnifiedProductFormSurface mode="create" />
}

function UnifiedProductFormEditLoader({ productId }: { productId: string }): ReactNode {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const {
    data: productPayload,
    error: productLoadError,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    enabled: sdk !== null,
    queryKey: ["catalog-product-detail-editor", productId],
    queryFn: async (): Promise<{ product: AdminProduct }> =>
      sdk!.admin.product.retrieve(productId, { fields: ADMIN_PRODUCT_EDITOR_FIELDS }),
  })

  if (!hasBackend) {
    return (
      <div className="p-4 md:p-6">
        <p className="rounded-md border border-border-subtle bg-surface-subtle px-4 py-3 text-sm text-content-secondary">
          Connect <code className="text-xs">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to edit products.
        </p>
      </div>
    )
  }

  if (isLoading || (isFetching && productPayload?.product === undefined)) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <p className="text-sm text-content-secondary" role="status">
            Loading product…
          </p>
        </div>
      </div>
    )
  }

  if (productLoadError !== null && productLoadError !== undefined) {
    const message =
      productLoadError instanceof Error
        ? productLoadError.message
        : "Unable to load this product."

    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <p
            className="rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content"
            role="alert"
          >
            {message}
          </p>
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const product = productPayload?.product
  if (product === undefined) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-feedback-danger-content" role="alert">
          Product not found.
        </p>
      </div>
    )
  }

  const bootstrap = buildCatalogEditFormBootstrap(product)
  const surfaceKey = `${product.id}:${product.updated_at ?? ""}`

  return (
    <UnifiedProductFormSurface
      key={surfaceKey}
      mode="edit"
      productId={productId}
      editBootstrap={bootstrap}
      hydratedProduct={product}
    />
  )
}

function UnifiedProductFormSurface({
  mode,
  productId,
  editBootstrap,
  hydratedProduct,
}: UnifiedProductFormSurfaceProps): ReactNode {
  const baseId = useId()
  const { toast } = useToast()
  const hasBackend = resolveMedusaAdminBackendUrl() !== null

  const shippingContextRef = useRef<UnifiedCatalogProductShippingContext | null>(null)

  const controller = useUnifiedCatalogProductForm({
    mode,
    productId,
    editBootstrap,
    hydratedProduct,
    onSuccessfulCreateNavigate: undefined,
    shippingContextRef,
  })

  const {
    title,
    description,
    isPublished,
    optionRows,
    hasDefinedOptions,
    derivedCombos,
    variantRowsPreview,
    hydratedProduct: resolvedHydratedProduct,
    categories,
    selectedCategoryIds,
    fieldErrors,
    formError,
    isSubmitting,
    isLoadingProductDetail,
    isDirty: isCatalogDirty,
    prerequisitesError,
    categoriesError,
    setTitle,
    setDescription,
    setIsPublished,
    toggleCategory,
    addOptionRow,
    updateOptionRow,
    removeOptionRow,
    updateEconomicsRow,
    submit,
  } = controller

  const productHydrationKey =
    mode === "edit" && resolvedHydratedProduct !== undefined
      ? `${resolvedHydratedProduct.id}:${resolvedHydratedProduct.updated_at ?? ""}`
      : null

  const shipping = useUnifiedCatalogProductShipping({
    derivedCombos,
    productHydrationKey,
    productEntity: resolvedHydratedProduct,
    shippingBootstrap:
      editBootstrap !== undefined
        ? {
            isPhysicalProduct: editBootstrap.isPhysicalProduct,
            shippingByComboKey: editBootstrap.shippingByComboKey,
          }
        : undefined,
  })

  shippingContextRef.current = {
    requiresShipping: shipping.requiresShipping,
    resolveShippingForCombo: shipping.resolveShippingForCombo,
  }

  const metafields = useProductFormMetafields({
    productId: mode === "edit" ? productId : undefined,
    selectedCategoryIds,
    enabled: hasBackend,
  })

  const clubPricing = useClubPricingSection({
    productId: mode === "edit" ? productId : undefined,
    variantRows: variantRowsPreview,
    enabled: hasBackend && mode === "edit",
  })

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedCategoryIds.has(category.id)),
    [categories, selectedCategoryIds],
  )

  const titleTrimmed = title.trim()
  const documentTitle =
    titleTrimmed !== ""
      ? titleTrimmed
      : mode === "create"
        ? "Create product"
        : "Edit product"

  const isFormDirty = isCatalogDirty || metafields.isDirty || clubPricing.isDirty

  useUnsavedFormGuard({
    isDirty: isFormDirty,
    baseTitle: documentTitle,
    enabled: mode === "create" || !isLoadingProductDetail,
  })

  const metafieldsLoadState =
    metafields.state.status === "loading" || metafields.state.status === "idle"
      ? "loading"
      : metafields.state.status === "error"
        ? "error"
        : "ready"

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    try {
      const metafieldValidation = metafields.validateDrafts()
      if (!metafieldValidation.ok) {
        toast({
          variant: "error",
          title: "Fix metafield fields",
          description: metafieldValidation.message,
        })
        return
      }

      const savedProductId = await submit()

      if (typeof savedProductId === "string" && savedProductId.trim() !== "") {
        const payloads = metafields.buildPayloads(savedProductId)
        if (payloads.length > 0) {
          await metafields.persist(savedProductId)
        } else if (metafields.state.status === "ready") {
          metafields.markSaved(metafields.state.drafts)
        }

        if (clubPricing.isDirty) {
          try {
            await clubPricing.persist(savedProductId)
          } catch (clubError: unknown) {
            if (clubError instanceof Error) {
              toast({
                variant: "error",
                title: "Club member prices not saved",
                description: clubError.message,
              })
            }
            throw clubError
          }
        }
      }

      toast({
        variant: "success",
        title: mode === "create" ? "Product created" : "Product updated",
        description:
          mode === "create"
            ? "Your product, variants, stock levels, and metafields were saved in Medusa."
            : "Changes were saved to Medusa.",
      })
    } catch (errorCandidate: unknown) {
      if (errorCandidate instanceof UnifiedFormValidationError) {
        const detail = formatFieldErrorsIntoMessage(errorCandidate.fieldErrors)
        toast({
          variant: "error",
          title: "Fix the highlighted fields",
          description: detail === "" ? "Validation failed — review the form." : detail,
        })
        return
      }

      if (errorCandidate instanceof Error) {
        toast({
          variant: "error",
          title: "Save failed",
          description: errorCandidate.message,
        })
      }
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/products"
              className="text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              ← Products
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-content-primary">
              {mode === "create" ? "Create product" : "Edit product"}
            </h1>
            <p className="mt-2 text-sm text-content-secondary">
              Single scrollable flow: details, variant matrix, then per-variant price and stock for the
              primary stock location.
            </p>
          </div>
        </div>

        {!hasBackend ? (
          <p className="rounded-md border border-border-subtle bg-surface-subtle px-4 py-3 text-sm text-content-secondary">
            Connect <code className="text-xs">VITE_MEDUSA_ADMIN_BACKEND_URL</code> to enable live
            catalogue writes. This form stays visible for layout review.
          </p>
        ) : null}

        {prerequisitesError !== null && prerequisitesError !== undefined ? (
          <p className="rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content">
            {prerequisitesError instanceof Error
              ? prerequisitesError.message
              : "Unable to load Medusa prerequisites."}
          </p>
        ) : null}

        {categoriesError !== null && categoriesError !== undefined ? (
          <p className="rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content">
            {categoriesError instanceof Error
              ? categoriesError.message
              : "Unable to load product categories."}
          </p>
        ) : null}

        {formError !== null ? (
          <p
            className="rounded-md border border-feedback-danger-border bg-feedback-danger-subtle px-4 py-3 text-sm text-feedback-danger-content"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <form className="space-y-8" onSubmit={onSubmit} noValidate>
          <UnifiedProductDetailsSection
            baseId={baseId}
            title={title}
            description={description}
            isPublished={isPublished}
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            categoryMetafieldCounts={metafields.categoryMetafieldCounts}
            fieldErrors={fieldErrors}
            setTitle={setTitle}
            setDescription={setDescription}
            setIsPublished={setIsPublished}
            toggleCategory={toggleCategory}
          />

          <UnifiedProductVariantMatrixSection
            baseId={baseId}
            optionRows={optionRows}
            addOptionRow={addOptionRow}
            updateOptionRow={updateOptionRow}
            removeOptionRow={removeOptionRow}
          />

          {hasDefinedOptions ? (
            <UnifiedProductPricingSection
              baseId={baseId}
              variantRowsPreview={variantRowsPreview}
              fieldErrors={fieldErrors}
              updateEconomicsRow={updateEconomicsRow}
            />
          ) : null}

          {hasDefinedOptions ? (
            <ProductClubPricingSection
              baseId={baseId}
              variantRowsPreview={variantRowsPreview}
              loadState={clubPricing.loadState}
              fieldErrors={clubPricing.fieldErrors}
              drafts={clubPricing.drafts}
              disabled={isSubmitting || isLoadingProductDetail}
              onMemberPriceChange={clubPricing.updateMemberPrice}
              onRetry={clubPricing.reload}
            />
          ) : null}

          <UnifiedProductShippingSection
            baseId={baseId}
            isPhysicalProduct={shipping.isPhysicalProduct}
            variantRowsPreview={shipping.shippingVariantRowsPreview}
            shippingMap={shipping.shippingMap}
            onPhysicalProductChange={shipping.setIsPhysicalProduct}
            onShippingRowChange={shipping.updateShippingRow}
            onApplyShippingToAllVariants={shipping.applyShippingToAllVariants}
          />

          <ProductMetafieldsSection
            definitions={
              metafields.state.status === "ready" ? metafields.state.productDefinitions : []
            }
            drafts={metafields.state.status === "ready" ? metafields.state.drafts : {}}
            fieldErrors={metafields.fieldErrors}
            expandedSecondaryIds={metafields.expandedSecondaryIds}
            loadState={metafieldsLoadState}
            errorMessage={
              metafields.state.status === "error" ? metafields.state.message : undefined
            }
            disabled={isSubmitting || isLoadingProductDetail}
            onDraftChange={metafields.setDraft}
            onToggleSecondary={metafields.toggleSecondaryExpanded}
            onRetry={metafields.reload}
          />

          <ProductCategoryMetafieldsSection
            selectedCategories={selectedCategories}
            definitions={
              metafields.state.status === "ready" ? metafields.state.categoryDefinitions : []
            }
            drafts={metafields.state.status === "ready" ? metafields.state.drafts : {}}
            fieldErrors={metafields.fieldErrors}
            expandedSecondaryIds={metafields.expandedSecondaryIds}
            disabled={isSubmitting || isLoadingProductDetail}
            onDraftChange={metafields.setDraft}
            onToggleSecondary={metafields.toggleSecondaryExpanded}
          />

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={!hasBackend || isSubmitting || isLoadingProductDetail}
            >
              {mode === "create" ? "Create product" : "Save changes"}
            </Button>
            <Link
              className="inline-flex items-center text-sm font-medium text-interactive-primary hover:text-interactive-primary-hover"
              to="/products"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
