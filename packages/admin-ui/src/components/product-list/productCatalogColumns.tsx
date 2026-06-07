import { Link } from "react-router-dom"

import { ProductStatusBadge } from "@/components/product-list/ProductStatusBadge"
import { ProductThumbnail } from "@/components/product-list/ProductThumbnail"
import type { SortOption } from "@/components/ui/list/ListSortControl"
import type { ListColumnDef } from "@/components/ui/list/types"

import type { ProductListRow } from "@/data/mockProducts"

import type { ProductSortColumnPayload } from "@/hooks/products/useProductsCatalogList"

export type ProductColumnId =
  | "thumbnail"
  | "title"
  | "status"
  | "variantsCount"
  | "stockTotal"
  | "priceRange"
  | "updatedAt"

export const SORTABLE_PRODUCT_COLUMNS = new Set<ProductColumnId>([
  "title",
  "status",
  "updatedAt",
])

export const PRODUCT_CATALOG_SORT_OPTIONS: SortOption<keyof ProductSortColumnPayload>[] = [
  { id: "title", label: "Name" },
  { id: "status", label: "Status" },
  { id: "updatedAt", label: "Last updated" },
]

export const PRODUCT_CATALOG_COLUMNS: ListColumnDef<ProductListRow, ProductColumnId>[] = [
  {
    id: "thumbnail",
    header: "",
    sortable: false,
    headerClassName: "w-14 pr-0",
    cellClassName: "w-14 pr-0",
    skeletonVariant: "thumbnail",
    renderCell: (row) => (
      <ProductThumbnail
        title={row.title}
        imageUrl={row.thumbnailUrl ?? undefined}
        hue={row.thumbnailHue}
        size={40}
      />
    ),
  },
  {
    id: "title",
    header: "Product",
    sortable: true,
    skeletonVariant: "twoLine",
    getSortValue: (row) => row.title,
    renderCell: (row) => (
      <div className="flex min-w-0 flex-col">
        <Link
          to={`/products/${encodeURIComponent(row.id)}`}
          className="truncate font-medium text-content-primary transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
        >
          {row.title}
        </Link>
        <span className="truncate text-xs text-content-tertiary">{row.sku}</span>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    sortable: true,
    headerClassName: "w-36",
    skeletonVariant: "pill",
    getSortValue: (row) => row.status,
    renderCell: (row) => <ProductStatusBadge status={row.status} />,
  },
  {
    id: "variantsCount",
    header: "Variants",
    sortable: false,
    responsive: "lg",
    align: "right",
    headerClassName: "w-28",
    skeletonVariant: "number",
    cellClassName: "text-right text-sm tabular-nums text-content-secondary",
    renderCell: (row) => row.variantsCount,
  },
  {
    id: "stockTotal",
    header: "Stock",
    sortable: false,
    responsive: "md",
    align: "right",
    headerClassName: "w-24",
    skeletonVariant: "number",
    cellClassName: "text-right text-sm tabular-nums text-content-secondary",
    renderCell: (row) => (typeof row.stockTotal === "number" ? row.stockTotal : "–"),
  },
  {
    id: "priceRange",
    header: "Price",
    sortable: false,
    responsive: "lg",
    align: "right",
    headerClassName: "w-28",
    skeletonVariant: "number",
    cellClassName: "text-right text-sm tabular-nums text-content-secondary",
    renderCell: (row) => row.priceRangeLabel,
  },
  {
    id: "updatedAt",
    header: "Updated",
    sortable: true,
    responsive: "md",
    headerClassName: "w-40",
    skeletonVariant: "text",
    getSortValue: (row) => new Date(row.updatedAt).getTime(),
    cellClassName: "text-sm text-content-tertiary",
    renderCell: (row) => (
      <time dateTime={row.updatedAt}>
        {new Date(row.updatedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </time>
    ),
  },
]
