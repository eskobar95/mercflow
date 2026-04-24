import type { ReactNode } from "react"

/**
 * Client-side list sort for callback-driven table headers.
 * `none` means this column is not the active sort key.
 */
export type ListSortDirection = "asc" | "desc" | "none"

/**
 * Column definition for generic `DataTable` rows. Keep `TCol` a string enum of
 * column ids (e.g. "name" | "status") for typed sort state in parents.
 */
export type ListColumnDef<TRow, TCol extends string> = {
  id: TCol
  header: string
  /** Optional extra classes for header and body cells. */
  cellClassName?: string
  headerClassName?: string
  sortable?: boolean
  /**
   * Cell content for this row. Must not add interactive content that breaks
   * table focus order without proper labelling; keep actions in the row menu.
   */
  renderCell: (row: TRow) => ReactNode
  /**
   * Value used for client-side sorting when the parent uses `getSortValue` pattern.
   * Required when `sortable` is true and the parent implements sort.
   */
  getSortValue?: (row: TRow) => string | number | Date
}

/**
 * Server or client sort; parent column id + direction.
 * `null` column means the table is not sorted, or a non-column default order.
 */
export type ListSortState<TCol extends string> = {
  column: TCol | null
  direction: ListSortDirection
}

export type ListSelection = {
  selectedIds: Set<string>
  onSelectAll: (select: boolean) => void
  onSelectRow: (id: string, select: boolean) => void
}

export function compareSortValues(
  a: string | number | Date,
  b: string | number | Date
): number {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b
  }
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
}
