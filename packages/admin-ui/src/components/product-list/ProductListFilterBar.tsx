import { useRef, useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { cn } from "@/lib/cn"

// ── Types ─────────────────────────────────────────────────────────────────────

/** Operator options — enum fields use is/is-not; date fields use after/before. */
export type FilterOperator = "is" | "is not" | "after" | "before"

export type FilterCategoryType = "enum" | "date"

export type FilterCategory = {
  id: string
  label: string
  type: FilterCategoryType
  /** Operators shown in the chip's logic dropdown. */
  operators: FilterOperator[]
  values: Array<{ id: string; label: string }>
}

export type ActiveFilter = {
  categoryId: string
  operator: FilterOperator
  valueIds: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryByFilter(
  categories: FilterCategory[],
  categoryId: string,
): FilterCategory | undefined {
  return categories.find((c) => c.id === categoryId)
}

// ── Inline value picker Popover ───────────────────────────────────────────────

function ValuePickerPopover({
  category,
  selectedIds,
  onToggle,
  children,
}: {
  category: FilterCategory
  selectedIds: string[]
  onToggle: (valueId: string) => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-0" sideOffset={4}>
        <div className="py-1">
          <div className="border-b border-border-subtle px-3 pb-1.5 pt-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
              {category.label}
            </span>
          </div>
          {category.values.map((val) => {
            const active = selectedIds.includes(val.id)
            return (
              <button
                key={val.id}
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-content-primary hover:bg-surface-subtle"
                onClick={() => onToggle(val.id)}
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors",
                    active
                      ? "border-accent bg-accent"
                      : "border-border-strong bg-surface-default",
                  )}
                  aria-hidden
                >
                  {active ? (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1.5 4l2 2 3-3"
                        stroke="white"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className={cn(active && "font-medium")}>{val.label}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ── Operator dropdown ─────────────────────────────────────────────────────────

function OperatorDropdown({
  operator,
  operators,
  onSelect,
}: {
  operator: FilterOperator
  operators: FilterOperator[]
  onSelect: (op: FilterOperator) => void
}): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-0.5 rounded px-1.5 py-px",
            "text-[11px] font-medium text-content-tertiary",
            "transition-colors hover:bg-surface-subtle hover:text-content-secondary",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong",
          )}
        >
          {operator}
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
            <path d="M1.5 3L4 5.5 6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="min-w-28 p-1">
        {operators.map((op) => (
          <DropdownMenuItem
            key={op}
            className={cn(
              "min-h-0 cursor-pointer px-2 py-1.5 text-[12px]",
              op === operator && "font-semibold text-accent",
            )}
            onSelect={() => onSelect(op)}
          >
            {op === operator ? (
              <span className="mr-1.5 inline-block w-2 text-accent">✓</span>
            ) : (
              <span className="mr-1.5 inline-block w-2" />
            )}
            {op}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Filter chip ───────────────────────────────────────────────────────────────

function FilterChip({
  filter,
  category,
  onOperatorChange,
  onValueToggle,
  onRemove,
}: {
  filter: ActiveFilter
  category: FilterCategory
  onOperatorChange: (op: FilterOperator) => void
  onValueToggle: (valueId: string) => void
  onRemove: () => void
}): JSX.Element {
  const valueLabels = filter.valueIds
    .map((id) => category.values.find((v) => v.id === id)?.label ?? id)
    .join(", ")

  return (
    <span
      className={cn(
        "inline-flex h-[26px] shrink-0 items-center gap-px",
        "rounded border border-border-default bg-surface-default",
        "text-[12px] ring-0 transition-shadow",
        "hover:border-border-strong",
      )}
    >
      {/* Category label — static */}
      <span className="select-none px-2 font-medium text-content-secondary">
        {category.label}
      </span>

      {/* Hairline separator */}
      <span className="h-4 w-px shrink-0 bg-border-subtle" aria-hidden />

      {/* Operator — DropdownMenu */}
      <OperatorDropdown
        operator={filter.operator}
        operators={category.operators}
        onSelect={onOperatorChange}
      />

      {/* Hairline separator */}
      <span className="h-4 w-px shrink-0 bg-border-subtle" aria-hidden />

      {/* Value — Popover to edit */}
      <ValuePickerPopover
        category={category}
        selectedIds={filter.valueIds}
        onToggle={onValueToggle}
      >
        <button
          type="button"
          className={cn(
            "max-w-[120px] truncate px-2 font-medium text-content-primary",
            "rounded transition-colors hover:bg-surface-subtle",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong",
          )}
          title={valueLabels}
        >
          {valueLabels || <span className="text-content-tertiary">choose…</span>}
        </button>
      </ValuePickerPopover>

      {/* Remove entire filter */}
      <button
        type="button"
        aria-label={`Remove ${category.label} filter`}
        className="flex h-full items-center px-1.5 text-content-tertiary transition-colors hover:text-content-primary"
        onClick={onRemove}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
          <path
            d="M2 2l5 5M7 2L2 7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  )
}

// ── Main filter popover (two-level category → values) ────────────────────────

function FilterMenuPopover({
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
  const [drill, setDrill] = useState<FilterCategory | null>(null)

  function close(): void {
    setOpen(false)
    setDrill(null)
  }

  function handleValueToggle(cat: FilterCategory, valueId: string): void {
    const existing = activeFilters.find((f) => f.categoryId === cat.id)
    if (existing) {
      const next = existing.valueIds.includes(valueId)
        ? existing.valueIds.filter((v) => v !== valueId)
        : [...existing.valueIds, valueId]
      onUpdate(cat.id, { valueIds: next })
    } else {
      const defaultOp: FilterOperator = cat.operators[0] ?? "is"
      onAdd({ categoryId: cat.id, operator: defaultOp, valueIds: [valueId] })
    }
  }

  function selectedCount(catId: string): number {
    return activeFilters.find((f) => f.categoryId === catId)?.valueIds.length ?? 0
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setDrill(null)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded px-2 text-[12px] font-medium text-content-secondary transition-colors hover:bg-surface-subtle hover:text-content-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <rect x="1.5" y="3"   width="10" height="1.25" rx="0.625" fill="currentColor" />
            <rect x="3"   y="6"   width="7"  height="1.25" rx="0.625" fill="currentColor" />
            <rect x="5"   y="9"   width="3"  height="1.25" rx="0.625" fill="currentColor" />
          </svg>
          Filter
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-52 p-0" sideOffset={6}>
        {drill ? (
          /* Level 2 — value checkboxes */
          <div>
            <div className="flex items-center gap-1 border-b border-border-subtle px-2 py-1.5">
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
                onClick={() => setDrill(null)}
                aria-label="Back to categories"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-[12px] font-semibold text-content-primary">
                {drill.label}
              </span>
            </div>
            <div className="py-1">
              {drill.values.map((val) => {
                const active = activeFilters
                  .find((f) => f.categoryId === drill.id)
                  ?.valueIds.includes(val.id) ?? false
                return (
                  <button
                    key={val.id}
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-content-primary hover:bg-surface-subtle"
                    onClick={() => handleValueToggle(drill, val.id)}
                  >
                    <span
                      className={cn(
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors",
                        active
                          ? "border-accent bg-accent"
                          : "border-border-strong bg-surface-default",
                      )}
                      aria-hidden
                    >
                      {active ? (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    <span className={cn(active && "font-medium")}>{val.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="border-t border-border-subtle px-3 py-1.5">
              <button
                type="button"
                className="text-[11px] text-accent hover:underline"
                onClick={close}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Level 1 — category list */
          <div className="py-1">
            <div className="px-3 pb-1.5 pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                Filter by
              </span>
            </div>
            {categories.map((cat) => {
              const count = selectedCount(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] text-content-primary hover:bg-surface-subtle"
                  onClick={() => setDrill(cat)}
                >
                  <span>{cat.label}</span>
                  <div className="flex items-center gap-1.5">
                    {count > 0 ? (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-accent px-1 text-[10px] font-bold text-white">
                        {count}
                      </span>
                    ) : null}
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden className="text-content-tertiary">
                      <path d="M3.5 2L7 5.5 3.5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong"
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

function SearchIcon(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// ── Filter results summary ────────────────────────────────────────────────────

export function FilterResultsSummary({
  totalItems,
  filteredItems,
  onClear,
}: {
  totalItems: number
  filteredItems: number
  onClear: () => void
}): JSX.Element | null {
  const hiddenCount = totalItems - filteredItems
  if (hiddenCount <= 0) return null

  return (
    <div className="flex items-center gap-3 border-b border-border-subtle bg-surface-subtle/60 px-4 py-2">
      <span className="text-[12px] text-content-tertiary">
        Showing{" "}
        <span className="font-medium text-content-secondary">{filteredItems}</span>{" "}
        of{" "}
        <span className="font-medium text-content-secondary">{totalItems}</span>
      </span>
      <span aria-hidden className="h-3 w-px bg-border-default" />
      <span className="text-[12px] text-content-tertiary">
        <span className="font-medium text-content-secondary">{hiddenCount}</span>{" "}
        hidden by filters
      </span>
      <button
        type="button"
        className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-content-tertiary transition-colors hover:text-content-secondary"
        onClick={onClear}
      >
        Clear Filters
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
          <path d="M2 2l5 5M7 2L2 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
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
        activeFilters.map((x) =>
          x.categoryId === f.categoryId ? { ...x, ...f } : x,
        ),
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

  function toggleValue(categoryId: string, valueId: string): void {
    const existing = activeFilters.find((f) => f.categoryId === categoryId)
    if (!existing) return
    updateFilter(categoryId, {
      valueIds: existing.valueIds.includes(valueId)
        ? existing.valueIds.filter((v) => v !== valueId)
        : [...existing.valueIds, valueId],
    })
  }

  function removeFilter(categoryId: string): void {
    onFiltersChange(activeFilters.filter((f) => f.categoryId !== categoryId))
  }

  function clearAll(): void {
    onFiltersChange([])
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border-subtle px-4 py-2">
      {/* Filter button */}
      <FilterMenuPopover
        categories={categories}
        activeFilters={activeFilters}
        onAdd={addFilter}
        onUpdate={updateFilter}
      />

      {/* Divider */}
      <span className="mx-0.5 h-4 w-px shrink-0 bg-border-default" aria-hidden />

      {/* Active chips */}
      {hasFilters ? (
        <>
          {activeFilters.map((f) => {
            const cat = getCategoryByFilter(categories, f.categoryId)
            if (!cat) return null
            return (
              <FilterChip
                key={f.categoryId}
                filter={f}
                category={cat}
                onOperatorChange={(op) => updateFilter(f.categoryId, { operator: op })}
                onValueToggle={(valueId) => toggleValue(f.categoryId, valueId)}
                onRemove={() => removeFilter(f.categoryId)}
              />
            )
          })}

          {/* Meta actions */}
          <span className="mx-0.5 h-4 w-px shrink-0 bg-border-default" aria-hidden />
          <button
            type="button"
            className="shrink-0 text-[11px] font-medium text-content-tertiary transition-colors hover:text-content-secondary"
          >
            Match all
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-[11px] font-medium text-content-tertiary transition-colors hover:text-feedback-danger-content"
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

      {/* Push search to right */}
      <span className="flex-1" />
      <SearchToggle
        value={search}
        onChange={onSearchChange}
        onClear={onSearchClear}
      />
    </div>
  )
}
