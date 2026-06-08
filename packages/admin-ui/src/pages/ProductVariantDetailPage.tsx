import { type ReactNode, useMemo } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import type { AdminProduct } from "@medusajs/types"
import { useQuery } from "@tanstack/react-query"

import { usePageChrome } from "@/components/layout/pageChrome"
import { ProductSaveBar } from "@/components/products/editor/ProductSaveBar"
import { useVariantEditor } from "@/components/products/variants/useVariantEditor"
import { VariantDimensionsSection } from "@/components/products/variants/VariantDimensionsSection"
import { VariantIdentifiersSection } from "@/components/products/variants/VariantIdentifiersSection"
import { VariantInventorySection } from "@/components/products/variants/VariantInventorySection"
import { VariantPricingSection } from "@/components/products/variants/VariantPricingSection"
import { Card } from "@/components/ui/Card"
import { IconChevronLeft } from "@/components/ui/icons"
import { Spinner } from "@/components/ui/Spinner"
import { ADMIN_PRODUCT_EDITOR_FIELDS } from "@/lib/products/adminProductEditorFields"
import { fetchProductFormPrerequisites } from "@/lib/products/productUnifiedPersistence"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

export function ProductVariantDetailPage(): ReactNode {
  const { productId, variantId } = useParams<{ productId: string; variantId: string }>()
  const navigate = useNavigate()
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])

  const { data: productData, isLoading: productLoading } = useQuery({
    enabled: sdk !== null && productId !== undefined,
    queryKey: ["variant-detail", productId, variantId],
    queryFn: async (): Promise<AdminProduct | null> => {
      if (sdk === null || productId === undefined) {
        return null
      }
      const response = await sdk.admin.product.retrieve(productId, { fields: ADMIN_PRODUCT_EDITOR_FIELDS })
      return response.product
    },
  })

  const { data: prereqData } = useQuery({
    enabled: sdk !== null,
    queryKey: ["catalog-product-form-prereq"],
    queryFn: async () => {
      if (sdk === null) {
        return null
      }
      return fetchProductFormPrerequisites(sdk)
    },
  })

  const product = productData ?? undefined
  const variant = product?.variants?.find((row) => row.id === variantId)

  const editor = useVariantEditor({
    variant,
    productId: productId ?? "",
    variantId: variantId ?? "",
    primaryStockLocationId: prereqData?.primaryStockLocationId,
  })

  const backHref = `/products/${encodeURIComponent(productId ?? "")}?tab=variants`

  const variantTitle = variant?.title
  const chrome = useMemo(
    () => ({
      titleOverride: variantTitle !== null && variantTitle !== undefined && variantTitle.trim() !== "" ? variantTitle : "Variant",
      titleBadge: null,
      actions: null,
    }),
    [variantTitle],
  )
  usePageChrome(chrome)

  if (productId === undefined || variantId === undefined) {
    return (
      <div className="p-6">
        <Link to="/products" className="text-sm font-medium text-interactive-primary">
          ← Back to products
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 pb-2 md:p-6 md:pb-2">
      <Link
        to={backHref}
        className="mb-4 inline-flex items-center gap-1 text-xs text-content-tertiary transition-colors duration-150 hover:text-content-secondary"
      >
        <IconChevronLeft size={14} />
        {product?.title?.trim() !== "" ? product?.title : "Product"}
      </Link>

      {productLoading ? (
        <Card compact>
          <div className="flex items-center gap-2 text-sm text-content-tertiary">
            <Spinner size="sm" /> Loading variant…
          </div>
        </Card>
      ) : variant === undefined ? (
        <Card compact>
          <p className="text-sm text-content-secondary">
            This variant could not be found.{" "}
            <button
              type="button"
              onClick={() => navigate(backHref)}
              className="font-medium text-interactive-primary hover:text-interactive-primary-hover"
            >
              Back to variants
            </button>
          </p>
        </Card>
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          <VariantIdentifiersSection draft={editor.draft} update={editor.update} />
          <VariantPricingSection draft={editor.draft} update={editor.update} />
          <VariantInventorySection draft={editor.draft} update={editor.update} />
          <VariantDimensionsSection draft={editor.draft} update={editor.update} />
        </div>
      )}

      <ProductSaveBar
        visible={editor.isDirty}
        saving={editor.isSaving}
        canSave={editor.canSave}
        onSave={() => {
          void editor.save()
        }}
        onDiscard={editor.discard}
        message="Unsaved variant changes"
      />
    </div>
  )
}
