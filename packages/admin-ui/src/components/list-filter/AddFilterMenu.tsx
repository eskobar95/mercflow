import { useState } from "react"

import { CheckRow } from "@/components/list-filter/primitives"
import type { ActiveFilter, FilterCategory, FilterOperator } from "@/components/list-filter/types"
import { IconChevronRight, IconClose, IconFilter, IconSearch } from "@/components/ui/icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"

import { cn } from "@/lib/cn"

type AddFilterMenuProps = {
  categories: FilterCategory[]
  activeFilters: ActiveFilter[]
  onAdd: (filter: ActiveFilter) => void
  onUpdate: (categoryId: string, patch: Partial<ActiveFilter>) => void
  /** Apply a free-text search (the "Search …" command). */
  onSearchSubmit: (value: string) => void
  /** Accessible name for the filter trigger. */
  filterAriaLabel?: string
}

/**
 * Filter menu — one compact command surface (Linear "Add filter").
 */
export function AddFilterMenu({
  categories,
  activeFilters,
  onAdd,
  onUpdate,
  onSearchSubmit,
  filterAriaLabel = "Filter list",
}: AddFilterMenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const normalizedQuery = query.trim().toLowerCase()
  const visibleCategories =
    normalizedQuery.length === 0
      ? categories
      : categories.filter(
          (c) =>
            c.label.toLowerCase().includes(normalizedQuery) ||
            c.values.some((v) => v.label.toLowerCase().includes(normalizedQuery)),
        )

  function resetAndClose(): void {
    setOpen(false)
    setOpenCategoryId(null)
    setQuery("")
  }

  function submitSearch(): void {
    if (query.trim().length === 0) return
    onSearchSubmit(query.trim())
    resetAndClose()
  }

  function toggleValue(category: FilterCategory, valueId: string): void {
    const existing = activeFilters.find((f) => f.categoryId === category.id)
    if (existing) {
      const next = existing.valueIds.includes(valueId)
        ? existing.valueIds.filter((v) => v !== valueId)
        : [...existing.valueIds, valueId]
      onUpdate(category.id, { valueIds: next })
    } else {
      const defaultOp: FilterOperator = category.operators[0] ?? "is"
      onAdd({ categoryId: category.id, operator: defaultOp, valueIds: [valueId] })
    }
  }

  function selectedCount(categoryId: string): number {
    return activeFilters.find((f) => f.categoryId === categoryId)?.valueIds.length ?? 0
  }

  const activeCount = activeFilters.reduce((sum, f) => sum + f.valueIds.length, 0)
  const hasQuery = query.trim().length > 0

  const rowClass =
    "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors"
  const rowHoverClass = "hover:bg-surface-subtle hover:text-content-primary"

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true)
        } else {
          resetAndClose()
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={filterAriaLabel}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border-default bg-surface-appCard px-2.5",
            "text-xs font-medium text-content-secondary",
            "transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "hover:border-border-strong hover:text-content-primary",
            "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-appCard",
            open && "border-border-strong text-content-primary",
          )}
        >
          <IconFilter size={14} className="shrink-0 text-content-tertiary" />
          Filter
          {activeCount > 0 ? (
            <span className="rounded-full bg-interactive-primary px-1.5 text-2xs font-semibold tabular-nums text-content-inverse">
              {activeCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-52 overflow-hidden p-0" sideOffset={4}>
        <div className="flex h-8 items-center gap-2 border-b border-border-subtle px-2">
          <IconSearch size={14} className="shrink-0 text-content-tertiary" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                if (hasQuery) {
                  submitSearch()
                } else {
                  resetAndClose()
                }
              }
            }}
            placeholder="Filter…"
            aria-label="Search or filter"
            className="h-full w-full min-w-0 bg-transparent text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none"
          />
          {hasQuery ? (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => setQuery("")}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-content-tertiary transition-colors hover:text-content-primary"
            >
              <IconClose size={12} />
            </button>
          ) : null}
        </div>

        <div className="p-1">
          <div className="flex flex-col gap-px">
            {visibleCategories.map((category) => {
              const count = selectedCount(category.id)
              const activeFilter = activeFilters.find((f) => f.categoryId === category.id)
              return (
                <Popover
                  key={category.id}
                  open={openCategoryId === category.id}
                  onOpenChange={(next) => setOpenCategoryId(next ? category.id : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        rowClass,
                        rowHoverClass,
                        openCategoryId === category.id
                          ? "bg-surface-subtle text-content-primary"
                          : "text-content-secondary",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{category.label}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-content-tertiary">
                        {count > 0 ? (
                          <span className="rounded-full bg-surface-subtle px-1.5 text-2xs font-semibold tabular-nums text-content-secondary">
                            {count}
                          </span>
                        ) : null}
                        <IconChevronRight size={12} />
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    sideOffset={4}
                    className="w-48 overflow-hidden p-1"
                  >
                    {category.values.map((val) => (
                      <CheckRow
                        key={val.id}
                        label={val.label}
                        tone={val.tone}
                        active={activeFilter?.valueIds.includes(val.id) ?? false}
                        onClick={() => toggleValue(category, val.id)}
                      />
                    ))}
                  </PopoverContent>
                </Popover>
              )
            })}

            {hasQuery ? (
              <>
                {visibleCategories.length > 0 ? (
                  <div className="my-1 h-px bg-border-subtle" />
                ) : null}
                <button
                  type="button"
                  onClick={submitSearch}
                  className={cn(rowClass, rowHoverClass, "text-content-secondary")}
                >
                  <IconSearch size={14} className="shrink-0 text-content-tertiary" />
                  <span className="min-w-0 flex-1 truncate">
                    Search{" "}
                    <span className="font-medium text-content-primary">“{query.trim()}”</span>
                  </span>
                  <kbd className="shrink-0 select-none rounded bg-surface-subtle px-1 font-sans text-3xs font-medium leading-none text-content-tertiary">
                    ↵
                  </kbd>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
