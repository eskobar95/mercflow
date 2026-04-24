import type { ListSortDirection } from "./types"

/**
 * ARIA `aria-sort` for `<th scope="col">` when a column is sortable.
 * Per WAI-ARIA, the attribute lives on the header cell, not the inner control.
 */
export function getColumnAriaSort(
  isActive: boolean,
  direction: ListSortDirection
): "ascending" | "descending" | "none" {
  if (!isActive) {
    return "none"
  }
  if (direction === "asc") {
    return "ascending"
  }
  if (direction === "desc") {
    return "descending"
  }
  return "none"
}
