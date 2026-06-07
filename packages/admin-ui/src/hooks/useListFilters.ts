import { useCallback, useState } from "react"

import type { ActiveFilter } from "@/components/list-filter/types"

import { useDebouncedValue } from "@/hooks/useDebouncedValue"

type UseListFiltersResult = {
  activeFilters: ActiveFilter[]
  searchDraft: string
  debouncedSearch: string
  hasActiveFilters: boolean
  hasChips: boolean
  isSearching: boolean
  addFilter: (next: ActiveFilter) => void
  updateFilter: (categoryId: string, patch: Partial<ActiveFilter>) => void
  toggleFilterValue: (categoryId: string, valueId: string) => void
  removeFilter: (categoryId: string) => void
  clearAllFilters: () => void
  setSearchDraft: (value: string) => void
  resetPage: () => void
}

type UseListFiltersArgs = {
  onPageReset: () => void
  debounceMs?: number
}

/**
 * Generic chip + free-text search state for MercFlow list pages. Domain hooks
 * derive API query params from `activeFilters` (status buckets, etc.).
 */
export function useListFilters({
  onPageReset,
  debounceMs = 300,
}: UseListFiltersArgs): UseListFiltersResult {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [searchDraft, setSearchDraft] = useState("")
  const debouncedSearch = useDebouncedValue(searchDraft, debounceMs)

  const resetPage = useCallback((): void => {
    onPageReset()
  }, [onPageReset])

  const addFilter = useCallback(
    (next: ActiveFilter): void => {
      setActiveFilters((prev) => {
        const exists = prev.some((f) => f.categoryId === next.categoryId)
        return exists
          ? prev.map((f) => (f.categoryId === next.categoryId ? { ...f, ...next } : f))
          : [...prev, next]
      })
      resetPage()
    },
    [resetPage],
  )

  const updateFilter = useCallback(
    (categoryId: string, patch: Partial<ActiveFilter>): void => {
      setActiveFilters((prev) => {
        const next: ActiveFilter[] = []
        for (const filter of prev) {
          const updated = filter.categoryId === categoryId ? { ...filter, ...patch } : filter
          if (updated.valueIds.length > 0) {
            next.push(updated)
          }
        }
        return next
      })
      resetPage()
    },
    [resetPage],
  )

  const toggleFilterValue = useCallback(
    (categoryId: string, valueId: string): void => {
      setActiveFilters((prev) => {
        const existing = prev.find((f) => f.categoryId === categoryId)
        if (!existing) return prev
        const valueIds = existing.valueIds.includes(valueId)
          ? existing.valueIds.filter((v) => v !== valueId)
          : [...existing.valueIds, valueId]
        const next: ActiveFilter[] = []
        for (const filter of prev) {
          const updated = filter.categoryId === categoryId ? { ...filter, valueIds } : filter
          if (updated.valueIds.length > 0) {
            next.push(updated)
          }
        }
        return next
      })
      resetPage()
    },
    [resetPage],
  )

  const removeFilter = useCallback(
    (categoryId: string): void => {
      setActiveFilters((prev) => prev.filter((f) => f.categoryId !== categoryId))
      resetPage()
    },
    [resetPage],
  )

  const clearAllFilters = useCallback((): void => {
    setActiveFilters([])
    setSearchDraft("")
    resetPage()
  }, [resetPage])

  const hasActiveFilters = activeFilters.length > 0
  const hasChips = hasActiveFilters || searchDraft.trim().length > 0
  const isSearching = debouncedSearch !== searchDraft

  return {
    activeFilters,
    searchDraft,
    debouncedSearch,
    hasActiveFilters,
    hasChips,
    isSearching,
    addFilter,
    updateFilter,
    toggleFilterValue,
    removeFilter,
    clearAllFilters,
    setSearchDraft,
    resetPage,
  }
}
