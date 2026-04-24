type TableSkeletonProps = {
  /** Total columns including built-in select/actions if parent table adds them. */
  columnCount: number
  rowCount: number
  /** Include a leading select column. */
  showSelectColumn: boolean
  /** Trailing row actions column. */
  showActionsColumn: boolean
}

/**
 * Placeholder body while a list is loading. Uses pulse bars instead of
 * full-page spinners, per `admin-ui.mdc` list view guidance.
 */
export function TableSkeleton({
  columnCount,
  rowCount,
  showSelectColumn,
  showActionsColumn,
}: TableSkeletonProps): JSX.Element {
  const cols =
    (showSelectColumn ? 1 : 0) +
    columnCount +
    (showActionsColumn ? 1 : 0)

  return (
    <tbody
      className="animate-pulse"
      role="rowgroup"
      aria-hidden="true"
    >
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <tr
          key={rowIndex}
          className="border-b border-border-subtle"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 w-full max-w-md rounded-sm bg-surface-subtle" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}
