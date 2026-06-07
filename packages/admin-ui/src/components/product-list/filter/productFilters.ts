import {
  isProductStatus,
  PRODUCT_STATUSES,
  PRODUCT_STATUS_FILTER_VALUES,
  type ProductStatus,
} from "@/components/product-list/productStatusMeta"

import type { ActiveFilter, FilterCategory } from "@/components/list-filter/types"

/** Filterable product properties surfaced in the catalogue toolbar. */
export const PRODUCT_FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "status",
    label: "Status",
    type: "enum",
    operators: ["is", "is not"],
    values: PRODUCT_STATUS_FILTER_VALUES,
  },
]

/**
 * Translate the active filter set into the status values the catalogue query
 * understands. Returns an empty array (meaning "all statuses") when no status
 * filter is active.
 */
export function deriveStatusesFromFilters(filters: ActiveFilter[]): ProductStatus[] {
  const statusFilter = filters.find((filter) => filter.categoryId === "status")
  if (!statusFilter || statusFilter.valueIds.length === 0) {
    return []
  }

  const selected = statusFilter.valueIds.filter(isProductStatus)

  if (statusFilter.operator === "is not") {
    return PRODUCT_STATUSES.filter((status) => !selected.includes(status))
  }

  return selected
}
