import type { ReactNode } from "react"

import { cn } from "@/lib/cn"

import {
  listResponsiveClass,
  listUtilityColClass,
  type ListSkeletonVariant,
  type SkeletonColumn,
} from "./types"

type TableSkeletonProps = {
  /** Column descriptors — drive per-column silhouette, width and responsive hiding. */
  columns: SkeletonColumn[]
  rowCount: number
  /** Include a leading select column. */
  showSelectColumn: boolean
  /** Trailing row actions column. */
  showActionsColumn: boolean
}

const bar = "rounded bg-surface-subtle"

/** A single column's loading silhouette. Mirrors the real cell's shape. */
function Silhouette({
  variant,
  rowIndex,
}: {
  variant: ListSkeletonVariant
  rowIndex: number
}): ReactNode {
  switch (variant) {
    case "thumbnail":
      return <div className="h-10 w-10 rounded-md bg-surface-subtle" />
    case "twoLine":
      return (
        <div className="flex flex-col gap-1.5">
          {/* Alternate the title width per row so the column reads organic, not striped. */}
          <div className={cn(bar, "h-3.5", rowIndex % 2 === 0 ? "w-40" : "w-52")} />
          <div className={cn(bar, "h-3 w-24")} />
        </div>
      )
    case "pill":
      return <div className="h-5 w-20 rounded-full bg-surface-subtle" />
    case "number":
      return <div className={cn(bar, "h-3.5 w-8")} />
    case "text":
    default:
      return <div className={cn(bar, "h-3.5 w-24")} />
  }
}

/**
 * Placeholder body while a list is loading. The parent table is `table-fixed`,
 * so column widths come from the header row and stay pixel-identical between
 * loading and loaded — the skeleton only paints content silhouettes, never
 * reflows the grid.
 */
export function TableSkeleton({
  columns,
  rowCount,
  showSelectColumn,
  showActionsColumn,
}: TableSkeletonProps): ReactNode {
  return (
    <tbody className="animate-pulse" aria-hidden="true">
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border-subtle last:border-0">
          {showSelectColumn ? (
            <td className={cn(listUtilityColClass, "px-4 py-3 align-middle")}>
              {rowIndex === 0 ? <span className="sr-only">Select rows</span> : null}
            </td>
          ) : null}
          {columns.map((col) => {
            const alignRight = col.align === "right"
            return (
              <td
                key={col.id}
                className={cn(
                  "px-4 py-3 align-middle",
                  col.responsive ? listResponsiveClass[col.responsive] : undefined,
                  col.headerClassName,
                )}
              >
                <div className={cn("flex items-center", alignRight && "justify-end")}>
                  <Silhouette
                    variant={col.skeletonVariant ?? "text"}
                    rowIndex={rowIndex}
                  />
                </div>
              </td>
            )
          })}
          {showActionsColumn ? (
            <td className={cn(listUtilityColClass, "px-4 py-3 align-middle")}>
              {rowIndex === 0 ? <span className="sr-only">Actions</span> : null}
            </td>
          ) : null}
        </tr>
      ))}
    </tbody>
  )
}
