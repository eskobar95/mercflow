import { useMemo } from "react"

import { deriveStatusesFromFilters } from "@/components/product-list/filter/productFilters"

import type { ProductStatusValue } from "@/hooks/products/useProductsCatalogList"
import { useListFilters } from "@/hooks/useListFilters"

type UseProductCatalogFiltersResult = ReturnType<typeof useListFilters> & {
  statuses: ProductStatusValue[]
}

type UseProductCatalogFiltersArgs = {
  onPageReset: () => void
}

export function useProductCatalogFilters({
  onPageReset,
}: UseProductCatalogFiltersArgs): UseProductCatalogFiltersResult {
  const base = useListFilters({ onPageReset, debounceMs: 300 })

  const statuses = useMemo(
    () => deriveStatusesFromFilters(base.activeFilters),
    [base.activeFilters],
  )

  return {
    ...base,
    statuses,
  }
}
