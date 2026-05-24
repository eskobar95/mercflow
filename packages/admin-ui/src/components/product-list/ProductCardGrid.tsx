import { Link } from "react-router-dom"

import type { ProductListRow } from "@/data/mockProducts"

import { ProductStatusBadge } from "./ProductStatusBadge"
import { ProductThumbnail } from "./ProductThumbnail"

/**
 * Mobile card view — replaces DataTable on small screens.
 * One card per product: thumbnail + key fields scannable vertically.
 */
export function ProductCardGrid({ rows }: { rows: ProductListRow[] }): JSX.Element {
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
          <li key={row.id}>
            <Link
              to={`/products/${encodeURIComponent(row.id)}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong"
            >
              <ProductThumbnail title={row.title} hue={row.thumbnailHue} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-content-primary">
                  {row.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-content-tertiary">
                  {row.collection} · <code className="font-mono">{row.sku}</code>
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
