import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { Checkbox } from "@/components/ui/Checkbox"
import type { ListSelection } from "@/components/ui/list/types"
import type { ProductListRow } from "@/data/mockProducts"

import { ProductStatusBadge } from "./ProductStatusBadge"
import { ProductThumbnail } from "./ProductThumbnail"

type ProductCardGridProps = {
  rows: ProductListRow[]
  selection?: ListSelection
}

/**
 * Mobile card view — replaces DataTable on small screens.
 * One card per product: thumbnail + key fields scannable vertically.
 */
export function ProductCardGrid({ rows, selection }: ProductCardGridProps): ReactNode {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-content-tertiary">
        No products match your filters.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border-subtle" role="list">
      {rows.map((row) => {
        const date = new Date(row.updatedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        return (
          <li key={row.id} className="flex items-center">
            {selection ? (
              <div className="shrink-0 pl-1">
                <Checkbox
                  touchTarget
                  checked={selection.selectedIds.has(row.id)}
                  onCheckedChange={(checked) => {
                    selection.onSelectRow(row.id, checked === true)
                  }}
                  aria-label={`Select ${row.title}`}
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
            ) : null}
            <Link
              to={`/products/${encodeURIComponent(row.id)}`}
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong"
            >
              <ProductThumbnail
                title={row.title}
                imageUrl={row.thumbnailUrl ?? undefined}
                hue={row.thumbnailHue}
                size={44}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-content-primary">
                  {row.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-content-tertiary tabular-nums">
                  {row.variantsCount}{" "}
                  {row.variantsCount === 1 ? "variant" : "variants"}
                  {" · "}Stock {typeof row.stockTotal === "number" ? row.stockTotal : "–"}
                  {" · "}
                  {row.priceRangeLabel}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <ProductStatusBadge status={row.status} />
                <span className="text-2xs text-content-tertiary">{date}</span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
