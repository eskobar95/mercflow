import type { SortOption } from "@/components/ui/list/ListSortControl"

import type { ProductSortColumnPayload } from "@/hooks/products/useProductsCatalogList"

import type { ProductColumnId } from "./productCatalogColumns"

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
