import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import type { AdminProduct } from "@medusajs/types"

import { IconChevronRight } from "@/components/ui/icons"
import { formatPriceRangeLabel } from "@/lib/products/mapAdminProductToListRow"

type VariantListTableProps = {
  product: AdminProduct
  productId: string
}

function stockLabel(manageInventory: boolean | undefined, quantity: number | null | undefined): string {
  if (manageInventory === false) {
    return "Not tracked"
  }
  return typeof quantity === "number" ? String(quantity) : "—"
}

/** Variant list — each row deep-links to the variant sub-page for editing. */
export function VariantListTable({ product, productId }: VariantListTableProps): ReactNode {
  const navigate = useNavigate()
  const variants = product.variants ?? []

  const open = (variantId: string): void => {
    navigate(`/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`)
  }

  return (
    <div className="overflow-hidden rounded-md border border-border-default">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-subtle text-2xs uppercase tracking-label text-content-tertiary">
            <th scope="col" className="px-3 py-2 font-semibold">Variant</th>
            <th scope="col" className="px-3 py-2 font-semibold">SKU</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Price</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Stock</th>
            <th scope="col" className="w-10 px-3 py-2" aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr
              key={variant.id}
              tabIndex={0}
              onClick={() => open(variant.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  open(variant.id)
                }
              }}
              className="cursor-pointer border-b border-border-subtle outline-none transition-colors duration-150 last:border-b-0 hover:bg-surface-subtle focus-visible:bg-surface-subtle"
            >
              <td className="px-3 py-2.5 font-medium text-content-primary">
                {variant.title?.trim() !== "" ? variant.title : "Variant"}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-content-secondary">
                {variant.sku?.trim() !== "" ? variant.sku : "—"}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-content-secondary">
                {formatPriceRangeLabel(variant.prices ?? [])}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-content-secondary">
                {stockLabel(variant.manage_inventory ?? undefined, variant.inventory_quantity)}
              </td>
              <td className="px-3 py-2.5 text-content-tertiary">
                <IconChevronRight size={14} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
