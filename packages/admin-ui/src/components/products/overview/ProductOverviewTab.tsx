import type { ReactNode } from "react"

import type { AdminProduct } from "@medusajs/types"

import type { ProductEditorController } from "@/components/products/editor/useProductEditor"

import { ProductBasicsSection } from "./ProductBasicsSection"
import { ProductMediaManager } from "./ProductMediaManager"
import { ProductOrganizationCard } from "./ProductOrganizationCard"
import { ProductShippingSection } from "./ProductShippingSection"
import { ProductSimplePricingSection } from "./ProductSimplePricingSection"
import { ProductStatusCard } from "./ProductStatusCard"

type ProductOverviewTabProps = {
  product: AdminProduct
  productId: string
  editor: ProductEditorController
  onManageVariants: () => void
}

/** Overview tab — two-column layout: editorial content left, organisation right. */
export function ProductOverviewTab({
  product,
  productId,
  editor,
  onManageVariants,
}: ProductOverviewTabProps): ReactNode {
  const { draft, update } = editor

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        <ProductBasicsSection draft={draft} update={update} />
        <ProductMediaManager draft={draft} update={update} />
        <ProductSimplePricingSection
          product={product}
          productId={productId}
          onManageVariants={onManageVariants}
        />
      </div>
      <div className="space-y-4">
        <ProductStatusCard draft={draft} update={update} />
        <ProductOrganizationCard draft={draft} update={update} />
        <ProductShippingSection draft={draft} update={update} />
      </div>
    </div>
  )
}
