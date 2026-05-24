import { useState } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"

import type { ActiveFilter, FilterCategory, FilterOperator } from "./types"
import { CheckRow } from "./primitives"

// ── FilterSearch (level-1 panel) ──────────────────────────────────────────────

function FilterSearch({
  categories,
  onSelect,
  selectedCount,
}: {
  categories: FilterCategory[]
  onSelect: (cat: FilterCategory) => void
  selectedCount: (catId: string) => number
}): JSX.Element {
  const [q, setQ] = useState("")
  const visible = q
    ? categories.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))
    : categories

  return (
    <>
      <div className="flex items-center gap-1.5 border-b border-border-subtle px-2.5 py-1.5">
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          aria-hidden
          className="shrink-0 text-content-tertiary"
        >
          <circle cx="4.8" cy="4.8" r="3.3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7.5 7.5L9.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          autoFocus
          type="text"
          placeholder="Filter…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-transparent text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none"
        />
      </div>
      <div className="py-0.5">
        {visible.length === 0 ? (
          <p className="px-2.5 py-2 text-2xs text-content-tertiary">No matches</p>
        ) : (
          visible.map((cat) => {
            const count = selectedCount(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                className="flex w-full items-center justify-between gap-2 px-2.5 py-1 text-left text-xs text-content-primary hover:bg-surface-subtle"
                onClick={() => onSelect(cat)}
              >
                <span>{cat.label}</span>
                <div className="flex items-center gap-1">
                  {count > 0 ? (
                    <span className="inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-sm bg-accent px-0.5 text-3xs font-bold text-white tabular-nums">
                      {count}
                    </span>
                  ) : null}
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 9 9"
                    fill="none"
                    aria-hidden
                    className="text-content-tertiary"
                  >
                    <path
                      d="M3 2L6 4.5 3 7"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
            )
          })
        )}
      </div>
    </>
  )
}

// ── FilterMenuPopover ─────────────────────────────────────────────────────────

type FilterMenuPopoverProps = {
  categories: FilterCategory[]
  activeFilters: ActiveFilter[]
  onAdd: (f: ActiveFilter) => void
  onUpdate: (categoryId: string, patch: Partial<ActiveFilter>) => void
}

export function FilterMenuPopover({
  categories,
  activeFilters,
  onAdd,
  onUpdate,
}: FilterMenuPopoverProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [drill, setDrill] = useState<FilterCategory | null>(null)

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
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded px-2 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-subtle hover:text-content-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <rect x="1.5" y="3"  width="10" height="1.25" rx="0.625" fill="currentColor" />
            <rect x="3"   y="6"  width="7"  height="1.25" rx="0.625" fill="currentColor" />
            <rect x="5"   y="9"  width="3"  height="1.25" rx="0.625" fill="currentColor" />
          </svg>
          Filter
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-44 p-0" sideOffset={6}>
        {drill ? (
          <div>
            <div className="flex items-center gap-1 border-b border-border-subtle px-1.5 py-1">
              <button
                type="button"
                className="flex h-5 w-5 items-center justify-center rounded text-content-tertiary hover:bg-surface-subtle hover:text-content-primary"
                onClick={() => setDrill(null)}
                aria-label="Back"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M6 2L3.5 5 6 8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className="text-2xs font-semibold text-content-secondary">
                {drill.label}
              </span>
            </div>
            <div className="py-0.5">
              {drill.values.map((val) => {
                const active =
                  activeFilters
                    .find((f) => f.categoryId === drill.id)
                    ?.valueIds.includes(val.id) ?? false
                return (
                  <CheckRow
                    key={val.id}
                    label={val.label}
                    active={active}
                    onClick={() => handleValueToggle(drill, val.id)}
                  />
                )
              })}
            </div>
          </div>
        ) : (
          <FilterSearch
            categories={categories}
            onSelect={setDrill}
            selectedCount={selectedCount}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
