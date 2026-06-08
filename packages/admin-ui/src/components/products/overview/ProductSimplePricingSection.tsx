import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import type { AdminProduct } from "@medusajs/types"

import { EditorSection } from "@/components/products/editor/EditorSection"
import { Button } from "@/components/ui/Button"
import { formatPriceRangeLabel } from "@/lib/products/mapAdminProductToListRow"

type Props = {
  product: AdminProduct
  productId: string
  onManageVariants: () => void
}

function stockLabel(manageInventory: boolean | undefined, quantity: number | null | undefined): string {
  if (manageInventory === false) {
    return "Not tracked"
  }
  return typeof quantity === "number" ? `${quantity} in stock` : "—"
}

/**
 * Read-only pricing/inventory summary on the Overview tab. Price and stock are
 * edited on the variant sub-page (single variant) or the Variants tab (multi),
 * keeping the Overview save model free of variant economics.
 */
export function ProductSimplePricingSection({ product, productId, onManageVariants }: Props): ReactNode {
  const variants = product.variants ?? []
  const single = variants.length === 1 ? variants[0] : undefined

  return (
    <EditorSection
      title="Pricing & inventory"
      action={
        <Button variant="ghost" size="sm" onClick={onManageVariants}>
          {variants.length > 1 ? "Manage variants" : "Manage"}
        </Button>
      }
    >
      {single !== undefined ? (
        <Link
          to={`/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(single.id)}`}
          className="flex items-center justify-between gap-3 rounded-md border border-border-subtle px-3 py-2.5 transition-colors duration-150 hover:border-border-strong"
        >
          <span className="text-sm font-medium text-content-primary">
            {formatPriceRangeLabel(single.prices ?? [])}
          </span>
          <span className="text-xs text-content-tertiary">
            {stockLabel(single.manage_inventory ?? undefined, single.inventory_quantity)}
          </span>
        </Link>
      ) : (
        <p className="text-sm text-content-secondary">
          {variants.length} variants. Pricing and stock are managed per variant in the Variants tab.
        </p>
      )}
    </EditorSection>
  )
}
