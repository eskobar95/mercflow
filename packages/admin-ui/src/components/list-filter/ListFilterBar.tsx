import type { ReactNode } from "react"

import { FilterChip } from "@/components/list-filter/FilterChip"
import type { ActiveFilter, FilterCategory } from "@/components/list-filter/types"
import { IconClose } from "@/components/ui/icons"

import { cn } from "@/lib/cn"
import { transitionGridReveal, transitionOpacityEnter } from "@/lib/motionClasses"

type ListFilterBarProps = {
  filterCategories: FilterCategory[]
  hasChips: boolean
  searchDraft: string
  activeFilters: ActiveFilter[]
  onClearSearch: () => void
  onOperatorChange: (categoryId: string, operator: ActiveFilter["operator"]) => void
  onValueToggle: (categoryId: string, valueId: string) => void
  onRemoveFilter: (categoryId: string) => void
  onClearAll: () => void
}

/**
 * Collapsible chip row for active list filters + the free-text search token.
 * Height and opacity animate via token-backed motion utilities.
 */
export function ListFilterBar({
  filterCategories,
  hasChips,
  searchDraft,
  activeFilters,
  onClearSearch,
  onOperatorChange,
  onValueToggle,
  onRemoveFilter,
  onClearAll,
}: ListFilterBarProps): ReactNode {
  return (
    <div
      className={cn(
        "grid",
        transitionGridReveal,
        hasChips ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
      aria-hidden={!hasChips}
    >
      <div className="overflow-hidden">
        <div
          {...({ inert: hasChips ? undefined : "" } as { inert?: string })}
          className={cn(
            "flex flex-wrap items-center gap-1.5 border-b border-border-subtle px-4 py-2",
            transitionOpacityEnter,
            hasChips ? "opacity-100" : "opacity-0",
          )}
        >
          {searchDraft.trim().length > 0 ? (
            <span className="mercflow-chip-in inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border-default bg-surface-appCard px-2 text-xs text-content-primary">
              <span className="font-medium text-content-secondary">Search</span>
              <span className="max-w-filterChip truncate">“{searchDraft.trim()}”</span>
              <button
                type="button"
                aria-label="Clear search"
                onClick={onClearSearch}
                className="-mr-0.5 flex h-4 w-4 items-center justify-center rounded-sm text-content-tertiary transition-colors hover:text-content-primary"
              >
                <IconClose size={12} />
              </button>
            </span>
          ) : null}

          {activeFilters.map((filter) => {
            const category = filterCategories.find((c) => c.id === filter.categoryId)
            if (!category) return null
            return (
              <FilterChip
                key={filter.categoryId}
                filter={filter}
                category={category}
                onOperatorChange={(op) => onOperatorChange(filter.categoryId, op)}
                onValueToggle={(valueId) => onValueToggle(filter.categoryId, valueId)}
                onRemove={() => onRemoveFilter(filter.categoryId)}
              />
            )
          })}

          <button
            type="button"
            onClick={onClearAll}
            className="ml-0.5 inline-flex h-7 items-center rounded-md px-2 text-xs font-medium text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  )
}
