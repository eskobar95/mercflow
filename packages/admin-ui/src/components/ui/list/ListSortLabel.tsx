import type { ListSortDirection } from "./types"

type ListSortLabelProps< TCol extends string> = {
  label: string
  columnId: TCol
  isActive: boolean
  direction: ListSortDirection
  sortable: boolean
  onRequestSort: (columnId: TCol) => void
  id: string
}

/**
 * Table header text with optional sort button and keyboard support.
 * Parent is responsible for applying sort to data and for cycling direction.
 */
export function ListSortLabel< TCol extends string>({
  label,
  columnId,
  isActive,
  direction,
  sortable,
  onRequestSort,
  id,
}: ListSortLabelProps< TCol>): JSX.Element {
  if (!sortable) {
    return <span className="text-left font-medium">{label}</span>
  }
  return (
    <button
      type="button"
      id={id}
      className="inline-flex items-center gap-1.5 text-left font-medium text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      onClick={() => onRequestSort(columnId)}
    >
      {label}
      <span className="text-content-tertiary" aria-hidden>
        {isActive && direction === "asc" ? "▲" : isActive && direction === "desc" ? "▼" : "⬍"}
      </span>
    </button>
  )
}
