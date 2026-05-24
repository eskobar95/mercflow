import { useRef, useState } from "react"

import { Checkbox } from "@/components/ui/Checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import { cn } from "@/lib/cn"

// ── Types ────────────────────────────────────────────────────────────────────

export type ActiveFilters = {
  collections: string[]
  updatedRange: UpdatedRange | null
}

export type UpdatedRange = "today" | "week" | "month"

const UPDATED_LABELS: Record<UpdatedRange, string> = {
  today: "Today",
  week:  "This week",
  month: "This month",
}

// ── Sub-components ───────────────────────────────────────────────────────────

function FilterPopover({
  collections,
  activeFilters,
  onChange,
}: {
  collections: string[]
  activeFilters: ActiveFilters
  onChange: (f: ActiveFilters) => void
}): JSX.Element {
  const totalActive =
    activeFilters.collections.length + (activeFilters.updatedRange ? 1 : 0)

  function toggleCollection(c: string): void {
    const next = activeFilters.collections.includes(c)
      ? activeFilters.collections.filter((x) => x !== c)
      : [...activeFilters.collections, c]
    onChange({ ...activeFilters, collections: next })
  }

  function setRange(r: UpdatedRange | null): void {
    onChange({ ...activeFilters, updatedRange: r })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded px-2 text-[12px] font-medium transition-colors",
            totalActive > 0
              ? "bg-accent-subtle text-accent-text hover:bg-accent-subtle/80"
              : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary",
          )}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <rect x="1.5" y="3" width="10" height="1.25" rx="0.625" fill="currentColor" />
            <rect x="3"   y="6" width="7"  height="1.25" rx="0.625" fill="currentColor" />
            <rect x="5"   y="9" width="3"  height="1.25" rx="0.625" fill="currentColor" />
          </svg>
          Filter
          {totalActive > 0 ? (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-accent text-[10px] font-bold text-white">
              {totalActive}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 p-0" sideOffset={6}>
        {/* Collection section */}
        <div className="border-b border-border-subtle px-3 py-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
            Collection
          </p>
          <div className="space-y-1">
            {collections.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-[13px] text-content-primary hover:bg-surface-subtle"
              >
                <Checkbox
                  checked={activeFilters.collections.includes(c)}
                  onCheckedChange={() => toggleCollection(c)}
                  aria-label={`Filter by collection: ${c}`}
                />
                {c}
              </label>
            ))}
          </div>
        </div>

        {/* Updated date section */}
        <div className="px-3 py-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
            Updated
          </p>
          <div className="space-y-1">
            {(["today", "week", "month"] as UpdatedRange[]).map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-[13px] text-content-primary hover:bg-surface-subtle"
              >
                <Checkbox
                  checked={activeFilters.updatedRange === r}
                  onCheckedChange={() =>
                    setRange(activeFilters.updatedRange === r ? null : r)
                  }
                  aria-label={`Filter by updated: ${UPDATED_LABELS[r]}`}
                />
                {UPDATED_LABELS[r]}
              </label>
            ))}
          </div>
        </div>

        {/* Clear */}
        {totalActive > 0 ? (
          <div className="border-t border-border-subtle px-3 py-2">
            <button
              type="button"
              className="text-[12px] text-content-tertiary hover:text-feedback-danger-content"
              onClick={() =>
                onChange({ collections: [], updatedRange: null })
              }
            >
              Clear all filters
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

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
    // wait for paint then focus
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
        className="inline-flex h-7 w-7 items-center justify-center rounded text-content-secondary transition-colors hover:bg-surface-subtle hover:text-content-primary"
        onClick={expand}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    )
  }

  return (
    <div className="relative flex items-center">
      <svg
        width="13"
        height="13"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden
        className="absolute left-2.5 text-content-tertiary"
      >
        <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={collapse}
        placeholder="Search products…"
        aria-label="Search products"
        className={cn(
          "h-7 w-48 rounded border border-border-default bg-surface-default pl-7 pr-6 text-[12px] text-content-primary",
          "placeholder:text-content-tertiary",
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
            // prevent blur from collapsing before clear fires
            e.preventDefault()
            onClear()
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}

// ── Filter chip ──────────────────────────────────────────────────────────────

function Chip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}): JSX.Element {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded border border-border-default bg-surface-subtle px-2 text-[11px] font-medium text-content-secondary">
      {label}
      <button
        type="button"
        aria-label={`Remove filter: ${label}`}
        className="ml-0.5 text-content-tertiary hover:text-content-primary"
        onClick={onRemove}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

type ProductListFilterBarProps = {
  collections: string[]
  activeFilters: ActiveFilters
  onFiltersChange: (f: ActiveFilters) => void
  search: string
  onSearchChange: (v: string) => void
  onSearchClear: () => void
}

/**
 * Linear-style filter bar for the product list.
 *
 * Compact by default: Filter button + search icon.
 * Active state: Filter shows badge count; search expands inline.
 * Below the bar: chips for each active filter, individually dismissable.
 */
export function ProductListFilterBar({
  collections,
  activeFilters,
  onFiltersChange,
  search,
  onSearchChange,
  onSearchClear,
}: ProductListFilterBarProps): JSX.Element {
  const chips: { label: string; onRemove: () => void }[] = [
    ...activeFilters.collections.map((c) => ({
      label: `Collection: ${c}`,
      onRemove: () =>
        onFiltersChange({
          ...activeFilters,
          collections: activeFilters.collections.filter((x) => x !== c),
        }),
    })),
    ...(activeFilters.updatedRange
      ? [
          {
            label: `Updated: ${UPDATED_LABELS[activeFilters.updatedRange]}`,
            onRemove: () =>
              onFiltersChange({ ...activeFilters, updatedRange: null }),
          },
        ]
      : []),
  ]

  return (
    <div>
      {/* Compact toolbar row */}
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-2">
        <div className="flex items-center gap-1">
          <FilterPopover
            collections={collections}
            activeFilters={activeFilters}
            onChange={onFiltersChange}
          />

          {/* Divider */}
          <span className="mx-1 h-4 w-px bg-border-default" aria-hidden />

          {/* Active sort label shown if filters are set */}
          {chips.length > 0 ? (
            <button
              type="button"
              className="text-[11px] text-content-tertiary hover:text-feedback-danger-content"
              onClick={() =>
                onFiltersChange({ collections: [], updatedRange: null })
              }
            >
              Clear all
            </button>
          ) : (
            <span className="text-[11px] text-content-tertiary">
              No active filters
            </span>
          )}
        </div>

        {/* Search — icon collapses to input */}
        <SearchToggle
          value={search}
          onChange={onSearchChange}
          onClear={onSearchClear}
        />
      </div>

      {/* Chips row — only when filters are active */}
      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border-subtle bg-surface-subtle/50 px-4 py-2">
          {chips.map((chip) => (
            <Chip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
