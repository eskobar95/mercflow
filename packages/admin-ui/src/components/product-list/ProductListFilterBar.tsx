import { useRef, useState } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { cn } from "@/lib/cn"

// ── Types ─────────────────────────────────────────────────────────────────────

export type FilterOperator = "is" | "is not"

export type ActiveFilter = {
  categoryId: string
  operator: FilterOperator
  valueIds: string[]
}

export type FilterCategory = {
  id: string
  label: string
  values: Array<{ id: string; label: string }>
}

// ── Filter popover (two-level: category → values) ────────────────────────────

function FilterPopover({
  categories,
  activeFilters,
  onAdd,
  onUpdate,
}: {
  categories: FilterCategory[]
  activeFilters: ActiveFilter[]
  onAdd: (f: ActiveFilter) => void
  onUpdate: (categoryId: string, patch: Partial<ActiveFilter>) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(null)

  function handleCategoryClick(cat: FilterCategory): void {
    setActiveCategory(cat)
  }

  function handleBack(): void {
    setActiveCategory(null)
  }

  function handleValueToggle(cat: FilterCategory, valueId: string): void {
    const existing = activeFilters.find((f) => f.categoryId === cat.id)
    if (existing) {
      const next = existing.valueIds.includes(valueId)
        ? existing.valueIds.filter((v) => v !== valueId)
        : [...existing.valueIds, valueId]
      onUpdate(cat.id, { valueIds: next })
    } else {
      onAdd({ categoryId: cat.id, operator: "is", valueIds: [valueId] })
    }
  }

  function getSelected(catId: string): string[] {
    return activeFilters.find((f) => f.categoryId === catId)?.valueIds ?? []
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setActiveCategory(null)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded px-2 text-[12px] font-medium text-content-secondary transition-colors hover:bg-surface-subtle hover:text-content-primary"
        >
          <FilterIcon />
          Filter
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-52 p-0" sideOffset={6}>
        {activeCategory ? (
          /* ── Level 2: value checkboxes ── */
          <div>
            <div className="flex items-center gap-1 border-b border-border-subtle px-2 py-1.5">
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
                onClick={handleBack}
                aria-label="Back to categories"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-[12px] font-medium text-content-primary">
                {activeCategory.label}
              </span>
            </div>
            <div className="py-1">
              {activeCategory.values.map((val) => {
                const selected = getSelected(activeCategory.id).includes(val.id)
                return (
                  <button
                    key={val.id}
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-content-primary hover:bg-surface-subtle"
                    onClick={() => handleValueToggle(activeCategory, val.id)}
                  >
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors",
                        selected
                          ? "border-accent bg-accent"
                          : "border-border-strong bg-surface-default",
                      )}
                      aria-hidden
                    >
                      {selected ? (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    {val.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* ── Level 1: category list ── */
          <div className="py-1">
            <div className="px-3 pb-1 pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                Filter by
              </span>
            </div>
            {categories.map((cat) => {
              const count = getSelected(cat.id).length
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] text-content-primary hover:bg-surface-subtle"
                  onClick={() => handleCategoryClick(cat)}
                >
                  <span>{cat.label}</span>
                  <div className="flex items-center gap-1.5">
                    {count > 0 ? (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-accent px-1 text-[10px] font-bold text-white">
                        {count}
                      </span>
                    ) : null}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="text-content-tertiary">
                      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ── Operator toggle chip ──────────────────────────────────────────────────────

function OperatorToggle({
  operator,
  onToggle,
}: {
  operator: FilterOperator
  onToggle: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary"
      onClick={onToggle}
      title="Toggle operator"
    >
      {operator}
    </button>
  )
}

// ── Active filter chip ────────────────────────────────────────────────────────

function FilterChip({
  filter,
  categoryLabel,
  valueLabels,
  onToggleOperator,
  onRemoveAll,
}: {
  filter: ActiveFilter
  categoryLabel: string
  valueLabels: string[]
  onToggleOperator: () => void
  onRemoveAll: () => void
}): JSX.Element {
  const displayValue = valueLabels.join(", ")

  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-px rounded border border-border-default bg-surface-default text-[12px]">
      {/* Category label */}
      <span className="px-2 font-medium text-content-primary">{categoryLabel}</span>

      {/* Operator */}
      <OperatorToggle operator={filter.operator} onToggle={onToggleOperator} />

      {/* Value + per-value remove */}
      <span className="px-1.5 text-content-secondary">{displayValue}</span>

      {/* Remove whole filter */}
      <button
        type="button"
        aria-label={`Remove ${categoryLabel} filter`}
        className="flex h-full items-center px-1.5 text-content-tertiary transition-colors hover:text-content-primary"
        onClick={onRemoveAll}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  )
}

// ── Search toggle ─────────────────────────────────────────────────────────────

function SearchToggle({
  value,
  onChange,
  onClear,
}: {
  value: string
  onChange: (v: string) => void
  onClear: () => void
}): JSX.Element {
  const [expanded, setExpanded] = useState(Boolean(value))
  const inputRef = useRef<HTMLInputElement>(null)

  function expand(): void {
    setExpanded(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function collapse(): void {
    if (!value) setExpanded(false)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        aria-label="Search products"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary"
        onClick={expand}
      >
        <SearchIcon />
      </button>
    )
  }

  return (
    <div className="relative flex shrink-0 items-center">
      <span className="absolute left-2.5 text-content-tertiary" aria-hidden>
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={collapse}
        placeholder="Search…"
        aria-label="Search products"
        className={cn(
          "h-7 w-44 rounded border border-border-default bg-surface-default pl-7 pr-6",
          "text-[12px] text-content-primary placeholder:text-content-tertiary",
          "focus-visible:border-accent focus-visible:outline-none",
          "transition-[width,border-color] duration-150",
        )}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-2 text-content-tertiary hover:text-content-primary"
          onMouseDown={(e) => {
            e.preventDefault()
            onClear()
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function FilterIcon(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <rect x="1.5" y="3"   width="10" height="1.25" rx="0.625" fill="currentColor" />
      <rect x="3"   y="6"   width="7"  height="1.25" rx="0.625" fill="currentColor" />
      <rect x="5"   y="9"   width="3"  height="1.25" rx="0.625" fill="currentColor" />
    </svg>
  )
}

function SearchIcon(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

type ProductListFilterBarProps = {
  categories: FilterCategory[]
  activeFilters: ActiveFilter[]
  onFiltersChange: (f: ActiveFilter[]) => void
  search: string
  onSearchChange: (v: string) => void
  onSearchClear: () => void
}

/**
 * Linear-style filter bar.
 *
 * - "Filter" button → two-level popover (category → value checkboxes)
 * - Active filters appear as inline chips: [Category] [is ▾] [Value] [×]
 * - Operator toggle switches "is" ↔ "is not" on click
 * - "Clear" removes all filters; "Save" is a placeholder for persisted views
 */
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
    const existing = activeFilters.find((x) => x.categoryId === f.categoryId)
    if (existing) {
      onFiltersChange(
        activeFilters.map((x) => (x.categoryId === f.categoryId ? { ...x, ...f } : x)),
      )
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

  function toggleOperator(categoryId: string): void {
    onFiltersChange(
      activeFilters.map((f) =>
        f.categoryId === categoryId
          ? { ...f, operator: f.operator === "is" ? "is not" : "is" }
          : f,
      ),
    )
  }

  function removeFilter(categoryId: string): void {
    onFiltersChange(activeFilters.filter((f) => f.categoryId !== categoryId))
  }

  function clearAll(): void {
    onFiltersChange([])
  }

  function getCategoryLabel(categoryId: string): string {
    return categories.find((c) => c.id === categoryId)?.label ?? categoryId
  }

  function getValueLabels(f: ActiveFilter): string[] {
    const cat = categories.find((c) => c.id === f.categoryId)
    if (!cat) return f.valueIds
    return f.valueIds.map(
      (id) => cat.values.find((v) => v.id === id)?.label ?? id,
    )
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border-subtle px-4 py-2 scrollbar-none">
      {/* Filter button — always visible */}
      <FilterPopover
        categories={categories}
        activeFilters={activeFilters}
        onAdd={addFilter}
        onUpdate={updateFilter}
      />

      {/* Separator */}
      <span className="mx-0.5 h-4 w-px shrink-0 bg-border-default" aria-hidden />

      {/* Active filter chips — inline, horizontally scrollable */}
      {hasFilters ? (
        <>
          {activeFilters.map((f) => (
            <FilterChip
              key={f.categoryId}
              filter={f}
              categoryLabel={getCategoryLabel(f.categoryId)}
              valueLabels={getValueLabels(f)}
              onToggleOperator={() => toggleOperator(f.categoryId)}
              onRemoveAll={() => removeFilter(f.categoryId)}
            />
          ))}

          {/* Right-side actions */}
          <span className="mx-0.5 h-4 w-px shrink-0 bg-border-default" aria-hidden />
          <button
            type="button"
            className="shrink-0 text-[11px] font-medium text-content-tertiary transition-colors hover:text-content-secondary"
          >
            Match all
          </button>
          <button
            type="button"
            className="shrink-0 text-[11px] font-medium text-content-tertiary transition-colors hover:text-feedback-danger-content"
            onClick={clearAll}
          >
            Clear
          </button>
          <button
            type="button"
            className="shrink-0 text-[11px] font-medium text-accent transition-colors hover:text-accent-strong"
          >
            Save
          </button>
        </>
      ) : (
        <span className="text-[11px] text-content-tertiary">No active filters</span>
      )}

      {/* Search — pushed to far right */}
      <span className="flex-1" />
      <SearchToggle
        value={search}
        onChange={onSearchChange}
        onClear={onSearchClear}
      />
    </div>
  )
}
