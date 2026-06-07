import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { IconCheck } from "@/components/ui/icons"

import { cn } from "@/lib/cn"

export type SortDirection = "asc" | "desc"

export type SortOption<TCol extends string> = {
  id: TCol
  label: string
}

type ListSortControlProps<TCol extends string> = {
  options: SortOption<TCol>[]
  column: TCol
  direction: SortDirection
  onChange: (column: TCol, direction: SortDirection) => void
}

function SortGlyph({ direction }: { direction: SortDirection }): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0">
      <path d="M3.5 4.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.5 7h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.5 9.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d={direction === "asc" ? "M11 9.5V4.5m0 0L9.5 6M11 4.5 12.5 6" : "M11 4.5v5m0 0L9.5 8M11 9.5 12.5 8"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Compact sort dropdown for list page TopBar toolbars. */
export function ListSortControl<TCol extends string>({
  options,
  column,
  direction,
  onChange,
}: ListSortControlProps<TCol>): JSX.Element {
  const activeLabel = options.find((option) => option.id === column)?.label ?? "Sort"

  const directionItems: { id: SortDirection; label: string }[] = [
    { id: "asc", label: "Ascending" },
    { id: "desc", label: "Descending" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Sort by ${activeLabel}, ${direction === "asc" ? "ascending" : "descending"}`}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border-default bg-surface-appCard px-2.5",
            "text-xs font-medium text-content-secondary",
            "transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "hover:border-border-strong hover:text-content-primary",
            "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-appCard",
          )}
        >
          <SortGlyph direction={direction} />
          <span className="hidden sm:inline">{activeLabel}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[180px]">
        <p className="px-2 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wide text-content-tertiary">
          Sort by
        </p>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            className={cn(
              "!min-h-0 gap-2 px-2 py-1.5 text-sm",
              option.id === column ? "font-medium text-content-primary" : "text-content-secondary",
            )}
            onSelect={() => onChange(option.id, direction)}
          >
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden>
              {option.id === column ? <IconCheck size={12} /> : null}
            </span>
            {option.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {directionItems.map((item) => (
          <DropdownMenuItem
            key={item.id}
            className={cn(
              "!min-h-0 gap-2 px-2 py-1.5 text-sm",
              item.id === direction ? "font-medium text-content-primary" : "text-content-secondary",
            )}
            onSelect={() => onChange(column, item.id)}
          >
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden>
              {item.id === direction ? <IconCheck size={12} /> : null}
            </span>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
