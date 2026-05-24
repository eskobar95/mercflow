import { cn } from "@/lib/cn"

import type { ListSortDirection } from "./types"

type ListSortLabelProps<TCol extends string> = {
  label: string
  columnId: TCol
  isActive: boolean
  direction: ListSortDirection
  sortable: boolean
  onRequestSort: (columnId: TCol) => void
  id: string
}

function SortIcon({
  isActive,
  direction,
}: {
  isActive: boolean
  direction: ListSortDirection
}): JSX.Element {
  if (isActive && direction === "asc") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
        className="text-accent shrink-0"
      >
        <path d="M6 2.5L9.5 7H2.5L6 2.5Z" fill="currentColor" />
      </svg>
    )
  }
  if (isActive && direction === "desc") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
        className="text-accent shrink-0"
      >
        <path d="M6 9.5L2.5 5H9.5L6 9.5Z" fill="currentColor" />
      </svg>
    )
  }
  // Idle — show a neutral two-headed indicator, visible only on hover
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="shrink-0 opacity-0 transition-opacity duration-100 group-hover:opacity-40"
    >
      <path d="M6 2L8.5 5H3.5L6 2Z" fill="currentColor" />
      <path d="M6 10L3.5 7H8.5L6 10Z" fill="currentColor" />
    </svg>
  )
}

/**
 * Column header label + sort icon. Renders a full-width button when sortable
 * so the entire header cell is the click target.
 */
export function ListSortLabel<TCol extends string>({
  label,
  columnId,
  isActive,
  direction,
  sortable,
  onRequestSort,
  id,
}: ListSortLabelProps<TCol>): JSX.Element {
  if (!sortable) {
    return (
      <span className="text-[12px] font-medium text-content-tertiary">{label}</span>
    )
  }

  return (
    <button
      type="button"
      id={id}
      className={cn(
        "group inline-flex w-full items-center gap-1 text-left text-[12px] font-medium",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong",
        isActive ? "text-content-primary" : "text-content-tertiary hover:text-content-secondary",
      )}
      onClick={() => onRequestSort(columnId)}
    >
      {label}
      <SortIcon isActive={isActive} direction={direction} />
    </button>
  )
}
