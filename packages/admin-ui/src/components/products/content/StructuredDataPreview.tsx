import { type ReactNode, useMemo } from "react"

import type { AdminProduct } from "@medusajs/types"

import { EditorSection } from "@/components/products/editor/EditorSection"
import { resolveMedusaAssetUrl } from "@/lib/products/resolveMedusaAssetUrl"

type StructuredDataPreviewProps = {
  product: AdminProduct
}

/**
 * Read-only preview of the Product schema.org JSON-LD, generated locally from the
 * current product data. The live storefront output is rendered server-side and
 * governed by the global SEO settings (Settings → SEO → Structured data); this is
 * a representative preview, not the authoritative payload.
 */
export function StructuredDataPreview({ product }: StructuredDataPreviewProps): ReactNode {
  const jsonLd = useMemo(() => {
    const variant = product.variants?.[0]
    const dkkPrice = (variant?.prices ?? []).find(
      (price) => price.currency_code === "dkk" && typeof price.amount === "number",
    )

    const image = resolveMedusaAssetUrl(product.thumbnail ?? product.images?.[0]?.url ?? null)

    const totalStock = (product.variants ?? []).reduce((sum, current) => {
      return sum + (typeof current.inventory_quantity === "number" ? current.inventory_quantity : 0)
    }, 0)

    const payload: Record<string, unknown> = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.title ?? "",
    }

    if (typeof product.description === "string" && product.description.trim() !== "") {
      payload.description = product.description.trim()
    }
    if (image !== null) {
      payload.image = image
    }
    if (typeof variant?.sku === "string" && variant.sku !== "") {
      payload.sku = variant.sku
    }
    if (dkkPrice !== undefined && typeof dkkPrice.amount === "number") {
      payload.offers = {
        "@type": "Offer",
        price: (dkkPrice.amount / 100).toFixed(2),
        priceCurrency: "DKK",
        availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      }
    }

    return JSON.stringify(payload, null, 2)
  }, [product])

  return (
    <EditorSection
      title="Structured data preview"
      description="Generated from current product data. Toggle types in Settings → SEO → Structured data."
    >
      <pre className="overflow-x-auto rounded-md border border-border-subtle bg-surface-subtle p-3 text-xs leading-relaxed text-content-secondary">
        <code>{jsonLd}</code>
      </pre>
    </EditorSection>
  )
}
