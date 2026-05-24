import type { ActiveFilter, FilterCategory } from "./types"
import { FilterChip } from "./FilterChip"
import { FilterMenuPopover } from "./FilterMenuPopover"
import { SearchToggle } from "./SearchToggle"

export type { ActiveFilter, FilterCategory, FilterOperator, FilterCategoryType } from "./types"
export { FilterResultsSummary } from "./FilterResultsSummary"

// ── ProductListFilterBar ──────────────────────────────────────────────────────

type ProductListFilterBarProps = {
  categories: FilterCategory[]
  activeFilters: ActiveFilter[]
  onFiltersChange: (f: ActiveFilter[]) => void
  search: string
  onSearchChange: (v: string) => void
  onSearchClear: () => void
}

export function ProductListFilterBar({
  categories,
  activeFilters,
  onFiltersChange,
  search,
  onSearchChange,
  onSearchClear,
}: ProductListFilterBarProps): JSX.Element {
  const hasFilters = activeFilters.length > 0

  function addFilter(f: ActiveFilter): void {
    const alreadyActive = activeFilters.some((x) => x.categoryId === f.categoryId)
    if (alreadyActive) {
      onFiltersChange(activeFilters.map((x) => (x.categoryId === f.categoryId ? { ...x, ...f } : x)))
    } else {
      onFiltersChange([...activeFilters, f])
    }
  }

  function updateFilter(categoryId: string, patch: Partial<ActiveFilter>): void {
    onFiltersChange(
      activeFilters
        .map((f) => (f.categoryId === categoryId ? { ...f, ...patch } : f))
        .filter((f) => f.valueIds.length > 0),
    )
  }

  function toggleValue(categoryId: string, valueId: string): void {
    const existing = activeFilters.find((f) => f.categoryId === categoryId)
    if (!existing) return
    updateFilter(categoryId, {
      valueIds: existing.valueIds.includes(valueId)
        ? existing.valueIds.filter((v) => v !== valueId)
        : [...existing.valueIds, valueId],
    })
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border-subtle px-4 py-2">
      <FilterMenuPopover
        categories={categories}
        activeFilters={activeFilters}
        onAdd={addFilter}
        onUpdate={updateFilter}
      />

      <span className="mx-0.5 h-4 w-px shrink-0 bg-border-default" aria-hidden />

      {hasFilters ? (
        <>
          {activeFilters.map((f) => {
            const cat = categories.find((c) => c.id === f.categoryId)
            if (!cat) return null
            return (
              <FilterChip
                key={f.categoryId}
                filter={f}
                category={cat}
                onOperatorChange={(op) => updateFilter(f.categoryId, { operator: op })}
                onValueToggle={(valueId) => toggleValue(f.categoryId, valueId)}
                onRemove={() => onFiltersChange(activeFilters.filter((x) => x.categoryId !== f.categoryId))}
              />
            )
          })}

          <span className="mx-0.5 h-4 w-px shrink-0 bg-border-default" aria-hidden />
          <button
            type="button"
            className="shrink-0 text-2xs font-medium text-content-tertiary transition-colors hover:text-content-secondary"
          >
            Match all
          </button>
          <button
            type="button"
            onClick={() => onFiltersChange([])}
            className="shrink-0 text-2xs font-medium text-content-tertiary transition-colors hover:text-feedback-danger-content"
          >
            Clear
          </button>
          <button
            type="button"
            className="shrink-0 text-2xs font-medium text-accent transition-colors hover:text-accent-strong"
          >
            Save
          </button>
        </>
      ) : (
        <span className="text-2xs text-content-tertiary">No active filters</span>
      )}

      <span className="flex-1" />
      <SearchToggle value={search} onChange={onSearchChange} onClear={onSearchClear} />
    </div>
  )
}
