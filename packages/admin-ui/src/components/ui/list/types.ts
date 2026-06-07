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
/**
 * Placeholder silhouette this column shows while the list is loading. Lets the
 * skeleton mirror the real cell shape (thumbnail square, two-line title, status
 * pill, short number) instead of one generic bar — so loading reads as the same
 * layout, just unpainted. Defaults to `"text"`.
 */
export type ListSkeletonVariant = "thumbnail" | "twoLine" | "pill" | "number" | "text"

export type ListColumnAlign = "left" | "right"

/**
 * Minimal column shape the loading skeleton needs: width + responsive floor +
 * silhouette. `ListColumnDef` is structurally assignable to this, and bespoke
 * tables (e.g. category hierarchy) can pass a small literal array.
 */
export type SkeletonColumn = {
  id: string
  headerClassName?: string
  responsive?: "md" | "lg" | "xl"
  skeletonVariant?: ListSkeletonVariant
  align?: ListColumnAlign
}

export type ListColumnDef<TRow, TCol extends string> = {
  id: TCol
  header: string
  /** Optional extra classes for header and body cells. */
  cellClassName?: string
  headerClassName?: string
  /** Column text alignment — drives header, body, and skeleton placement. */
  align?: ListColumnAlign
  /**
   * Minimum breakpoint at which the column is shown. Columns below this width
   * are hidden so the table degrades gracefully on tablet without scrolling.
   */
  responsive?: "md" | "lg" | "xl"
  /** Loading silhouette for this column. @default "text" */
  skeletonVariant?: ListSkeletonVariant
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

/**
 * Per-breakpoint visibility for a column, keyed by its `responsive` floor.
 * Shared by the table and its skeleton so a hidden column stays hidden (and
 * aligned) in both states.
 */
export const listResponsiveClass: Record<
  NonNullable<ListColumnDef<unknown, string>["responsive"]>,
  string
> = {
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
}

/** Fixed width for leading select / trailing actions utility columns. */
export const listUtilityColClass = "w-12"

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
