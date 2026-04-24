import { useEffect, useId, useRef, type ReactNode } from "react"

import { ListSortLabel } from "./ListSortLabel"
import { getColumnAriaSort } from "./listSortState"
import { RowActionsMenu, type RowActionItem } from "./RowActionsMenu"
import { TableSkeleton } from "./TableSkeleton"
import type { ListColumnDef, ListSelection, ListSortState } from "./types"

const headerCell = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-content-tertiary"
const dataCell = "px-4 py-3 text-sm text-content-primary"

function HeaderSelectAllCheckbox({
  checked,
  indeterminate,
  "aria-label": ariaLabel,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  "aria-label": string
  onChange: (select: boolean) => void
}): JSX.Element {
  const ref = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 rounded border-border-default text-content-primary focus:ring-2 focus:ring-border-focus"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
    />
  )
}

type DataTableProps<TRow, TCol extends string> = {
  /** Root label for the grid (screen reader). */
  "aria-label": string
  caption?: string
  columns: ListColumnDef<TRow, TCol>[]
  data: TRow[]
  getRowId: (row: TRow) => string
  sortState: ListSortState<TCol>
  onRequestSort: (columnId: TCol) => void
  selection?: ListSelection
  getRowActions?: (row: TRow) => RowActionItem[] | null
  isLoading?: boolean
  skeletonRowCount?: number
  /** Rendered in place of the body when there are zero rows. */
  emptyState: ReactNode
  /** If false, do not add an actions column. */
  hasRowActions?: boolean
}

/**
 * List row grid: sortable token-backed table, optional bulk select and row menus.
 * Parents own filter and pagination; this component is the `DataTable` section only.
 */
export function DataTable<TRow, TCol extends string>({
  "aria-label": tableLabel,
  caption,
  columns,
  data,
  getRowId,
  sortState,
  onRequestSort,
  selection,
  getRowActions,
  isLoading = false,
  skeletonRowCount = 6,
  emptyState,
  hasRowActions = true,
}: DataTableProps<TRow, TCol>): JSX.Element {
  const tableId = useId()
  const colCount = columns.length
  const showActions = Boolean(hasRowActions && getRowActions)
  const showSelect = Boolean(selection)
  const spanCount =
    colCount + (showSelect ? 1 : 0) + (showActions ? 1 : 0)

  const allIds = data.map((row) => getRowId(row))
  const selected = selection
    ? allIds.filter((id) => selection.selectedIds.has(id))
    : []
  const allSelected = selection
    ? data.length > 0 && selected.length === data.length
    : false
  const someSelected = selection
    ? selected.length > 0 && selected.length < data.length
    : false

  const renderHeaderRow = (): JSX.Element => (
    <tr className="border-b border-border-default bg-surface-subtle">
      {selection ? (
        <th
          scope="col"
          className={`w-0 ${headerCell} align-middle`}
        >
          <span className="sr-only">Select rows</span>
          <HeaderSelectAllCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            aria-label="Select all rows on this page"
            onChange={(v) => {
              selection.onSelectAll(v)
            }}
          />
        </th>
      ) : null}
      {columns.map((col) => {
        const isActive = sortState.column === col.id
        const isSortable = Boolean(col.sortable)
        return (
          <th
            key={col.id}
            scope="col"
            className={`${headerCell} ${col.headerClassName ?? ""}`.trim()}
            aria-sort={
              isSortable
                ? getColumnAriaSort(
                    isActive,
                    isActive ? sortState.direction : "none"
                  )
                : undefined
            }
          >
            <ListSortLabel< TCol>
              id={`${tableId}-h-${col.id}`}
              label={col.header}
              columnId={col.id}
              isActive={isActive}
              direction={isActive ? sortState.direction : "none"}
              sortable={isSortable}
              onRequestSort={onRequestSort}
            />
          </th>
        )
      })}
      {showActions ? (
        <th className={`${headerCell} w-0 text-right`} scope="col">
          Actions
        </th>
      ) : null}
    </tr>
  )

  const renderBody = (): JSX.Element | null => {
    if (isLoading) {
      return (
        <TableSkeleton
          columnCount={colCount}
          rowCount={skeletonRowCount}
          showSelectColumn={showSelect}
          showActionsColumn={showActions}
        />
      )
    }
    if (data.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={spanCount} className="p-0">
              {emptyState}
            </td>
          </tr>
        </tbody>
      )
    }
    return (
      <tbody>
        {data.map((row) => {
          const rowId = getRowId(row)
          const isRowSelected = selection
            ? selection.selectedIds.has(rowId)
            : false
          const rowActions = getRowActions ? getRowActions(row) : null
          return (
            <tr
              key={rowId}
              className="border-b border-border-subtle last:border-0"
            >
              {selection ? (
                <td className={`w-0 ${dataCell} align-top`}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border-default"
                    checked={isRowSelected}
                    onChange={(e) => {
                      selection.onSelectRow(rowId, e.target.checked)
                    }}
                    aria-label={`Select row ${rowId}`}
                  />
                </td>
              ) : null}
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={`${dataCell} ${col.cellClassName ?? ""}`.trim()}
                >
                  {col.renderCell(row)}
                </td>
              ))}
              {showActions ? (
                <td className={`w-0 ${dataCell} text-right`}>
                  {rowActions && rowActions.length > 0 ? (
                    <RowActionsMenu
                      items={rowActions}
                      aria-label={`Row actions for ${rowId}`}
                    />
                  ) : null}
                </td>
              ) : null}
            </tr>
          )
        })}
      </tbody>
    )
  }

  return (
    <div className="overflow-x-auto rounded-t-lg border border-b-0 border-border-default">
      <table className="w-full min-w-0 border-collapse" aria-label={tableLabel}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>{renderHeaderRow()}</thead>
        {renderBody()}
      </table>
    </div>
  )
}
