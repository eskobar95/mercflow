import { useId, type ReactNode } from "react"

import { Checkbox } from "@/components/ui/Checkbox"
import { cn } from "@/lib/cn"

import { ListSortLabel } from "./ListSortLabel"
import { getColumnAriaSort } from "./listSortState"
import { RowActionsMenu, type RowActionItem } from "./RowActionsMenu"
import { TableSkeleton } from "./TableSkeleton"
import {
  listResponsiveClass,
  listUtilityColClass,
  type ListColumnDef,
  type ListSelection,
  type ListSortState,
} from "./types"

/** Header cell base — no uppercase, lighter density. Alignment is applied
 * separately (left by default, right when the column opts in) so the two never
 * collide in the class list — our `cn()` concatenates, it does not merge. */
const headerCellBase = "px-4 py-2.5"
const dataCell = "px-4 py-3 text-sm text-content-primary align-middle"

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
}): ReactNode {
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

type DataTableHeaderRowProps<TRow, TCol extends string> = {
  tableId: string
  columns: ListColumnDef<TRow, TCol>[]
  sortState: ListSortState<TCol>
  onRequestSort: (columnId: TCol) => void
  selection?: ListSelection
  showActions: boolean
  allSelected: boolean
  someSelected: boolean
}

function DataTableHeaderRow<TRow, TCol extends string>({
  tableId,
  columns,
  sortState,
  onRequestSort,
  selection,
  showActions,
  allSelected,
  someSelected,
}: DataTableHeaderRowProps<TRow, TCol>): ReactNode {
  return (
    <tr className="border-b border-border-subtle bg-surface-default">
      {selection ? (
        <th
          scope="col"
          className={cn(headerCellBase, listUtilityColClass, "align-middle")}
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
        const alignRight = col.align === "right"
        return (
          <th
            key={col.id}
            scope="col"
            className={cn(
              headerCellBase,
              alignRight ? "text-right" : "text-left",
              col.responsive ? listResponsiveClass[col.responsive] : undefined,
              col.headerClassName,
              isSortable && "transition-colors hover:bg-surface-subtle",
              isSortable && isActive && "bg-surface-subtle",
            )}
            aria-sort={
              isSortable
                ? getColumnAriaSort(
                    isActive,
                    isActive ? sortState.direction : "none"
                  )
                : undefined
            }
          >
            <ListSortLabel<TCol>
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
        <th className={cn(headerCellBase, listUtilityColClass, "text-right text-xs font-medium text-content-tertiary")} scope="col">
          <span className="sr-only">Actions</span>
        </th>
      ) : null}
    </tr>
  )
}

function DataTableCell<TRow>({
  row,
  renderCell,
}: {
  row: TRow
  renderCell: (row: TRow) => ReactNode
}): ReactNode {
  return renderCell(row)
}

type DataTableBodyProps<TRow, TCol extends string> = {
  columns: ListColumnDef<TRow, TCol>[]
  data: TRow[]
  getRowId: (row: TRow) => string
  selection?: ListSelection
  getRowActions?: (row: TRow) => RowActionItem[] | null
  onRowClick?: (row: TRow) => void
  isLoading: boolean
  skeletonRowCount: number
  emptyState: ReactNode
  showSelect: boolean
  showActions: boolean
  spanCount: number
}

function DataTableBody<TRow, TCol extends string>({
  columns,
  data,
  getRowId,
  selection,
  getRowActions,
  onRowClick,
  isLoading,
  skeletonRowCount,
  emptyState,
  showSelect,
  showActions,
  spanCount,
}: DataTableBodyProps<TRow, TCol>): ReactNode | null {
  if (isLoading) {
    return (
      <TableSkeleton
        columns={columns}
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
        const clickable = Boolean(onRowClick)
        return (
          <tr
            key={rowId}
            className={cn(
              "border-b border-border-subtle transition-colors last:border-0",
              clickable && "cursor-pointer hover:bg-surface-subtle",
            )}
            onClick={
              clickable
                ? (event) => {
                    if (
                      event.target instanceof HTMLElement &&
                      event.target.closest("a,button,input,[role='menu'],[data-row-stop]")
                    ) {
                      return
                    }
                    onRowClick?.(row)
                  }
                : undefined
            }
          >
            {selection ? (
              <td className={cn(listUtilityColClass, dataCell, "align-middle")}>
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
                className={cn(
                  dataCell,
                  col.responsive ? listResponsiveClass[col.responsive] : undefined,
                  col.cellClassName,
                )}
              >
                <DataTableCell row={row} renderCell={col.renderCell} />
              </td>
            ))}
            {showActions ? (
              <td className={cn(listUtilityColClass, dataCell, "text-right")}>
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
  /** Navigate when a row is clicked. Clicks on links/buttons inside the row are ignored. */
  onRowClick?: (row: TRow) => void
  isLoading?: boolean
  skeletonRowCount?: number
  /** Rendered in place of the body when there are zero rows. */
  emptyState: ReactNode
  /** If false, do not add an actions column. */
  hasRowActions?: boolean
  /**
   * Stretch the table to fill its (flex) parent so the empty / loading body
   * occupies the remaining height. Use in full-bleed lists where the footer
   * docks at the viewport bottom and the body should fill the gap above it.
   */
  fillHeight?: boolean
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
  onRowClick,
  isLoading = false,
  skeletonRowCount = 6,
  emptyState,
  hasRowActions = true,
  fillHeight = false,
}: DataTableProps<TRow, TCol>): ReactNode {
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

  // Tables don't stretch to a flex parent's height, so when `fillHeight` is set
  // and the body is empty we render the empty state as a flex sibling below the
  // header row instead of inside a cell — it then fills the gap above a docked
  // footer and centers cleanly.
  const fillEmpty = fillHeight && !isLoading && data.length === 0

  return (
    <div className={cn("overflow-x-auto", fillHeight && "flex flex-1 flex-col")}>
      <div className={cn("min-w-listTable", fillHeight && "flex flex-1 flex-col")}>
        <table className="w-full table-fixed border-collapse" aria-label={tableLabel}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <DataTableHeaderRow
              tableId={tableId}
              columns={columns}
              sortState={sortState}
              onRequestSort={onRequestSort}
              selection={selection}
              showActions={showActions}
              allSelected={allSelected}
              someSelected={someSelected}
            />
          </thead>
          {fillEmpty ? null : (
            <DataTableBody
              columns={columns}
              data={data}
              getRowId={getRowId}
              selection={selection}
              getRowActions={getRowActions}
              onRowClick={onRowClick}
              isLoading={isLoading}
              skeletonRowCount={skeletonRowCount}
              emptyState={emptyState}
              showSelect={showSelect}
              showActions={showActions}
              spanCount={spanCount}
            />
          )}
        </table>
        {fillEmpty ? (
          <div className="flex flex-1 items-center justify-center">{emptyState}</div>
        ) : null}
      </div>
    </div>
  )
}
