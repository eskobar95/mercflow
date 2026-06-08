import type { ReactNode } from "react"

import type { AdminProduct } from "@medusajs/types"

import { ProductContentTab } from "@/components/product-content/ProductContentTab"

import { StructuredDataPreview } from "./StructuredDataPreview"

type ProductContentSeoTabProps = {
  product: AdminProduct
  productId: string
  title: string
}

/**
 * Content & SEO tab. Rich text and SEO fields keep their existing locale-aware
 * save flow (ProductContentTab saves before switching language). The structured
 * data preview is read-only and does not hang off the global product save bar.
 */
export function ProductContentSeoTab({ product, productId, title }: ProductContentSeoTabProps): ReactNode {
  return (
    <div className="space-y-4">
      <ProductContentTab productId={productId} productTitleFallback={title} />
      <StructuredDataPreview product={product} />
    </div>
  )
}
