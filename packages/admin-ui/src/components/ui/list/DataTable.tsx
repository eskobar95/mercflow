import { useId, type ReactNode } from "react"

import { Checkbox } from "@/components/ui/Checkbox"

import { ListSortLabel } from "./ListSortLabel"
import { getColumnAriaSort } from "./listSortState"
import { RowActionsMenu, type RowActionItem } from "./RowActionsMenu"
import { TableSkeleton } from "./TableSkeleton"
import type { ListColumnDef, ListSelection, ListSortState } from "./types"

const headerCell = "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-content-tertiary"
const dataCell = "px-4 py-2.5 text-[13px] text-content-primary align-middle"

function HeaderSelectAllCheckbox({
  checked,
  indeterminate,
  id,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  id: string
  onChange: (select: boolean) => void
}): JSX.Element {
  return (
    <Checkbox
      id={id}
      touchTarget
      checked={indeterminate ? "indeterminate" : checked}
      onCheckedChange={(value) => {
        onChange(value === true)
      }}
      aria-label="Select all rows on this page"
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
            id={`${tableId}-select-all`}
            checked={allSelected}
            indeterminate={someSelected}
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
                  <Checkbox
                    touchTarget
                    checked={isRowSelected}
                    onCheckedChange={(value) => {
                      selection.onSelectRow(rowId, value === true)
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
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <table className="w-full border-collapse" aria-label={tableLabel}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>{renderHeaderRow()}</thead>
          {renderBody()}
        </table>
      </div>
    </div>
  )
}
