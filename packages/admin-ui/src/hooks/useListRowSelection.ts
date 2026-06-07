import { useCallback, useEffect, useMemo, useState } from "react"

import type { ListSelection } from "@/components/ui/list/types"
import { useAdjustStateWhenSnapshotChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

type UseListRowSelectionOptions = {
  /** Ids selected when "select all" is checked. Defaults to `rowIds`. */
  selectAllIds?: string[]
  /** When true, select-all adds to existing selection instead of replacing. */
  selectAllMerge?: boolean
  /** When true, deselect-all removes only visible `rowIds` instead of clearing all. */
  deselectAllPageScoped?: boolean
}

type UseListRowSelectionResult = {
  selectedIds: Set<string>
  selectedCount: number
  selection: ListSelection
  clearSelection: () => void
}

/**
 * Page-scoped row selection for list tables. Clears when `resetDeps` change
 * (page, filter, sort, etc.) and on Escape. Shared by catalogue and orders lists.
 */
export function useListRowSelection(
  rowIds: string[],
  resetDeps: readonly unknown[],
  options: UseListRowSelectionOptions = {},
): UseListRowSelectionResult {
  const {
    selectAllIds = rowIds,
    selectAllMerge = false,
    deselectAllPageScoped = false,
  } = options
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const clearSelection = useCallback((): void => {
    setSelectedIds((prev) => (prev.size === 0 ? prev : new Set()))
  }, [])

  useAdjustStateWhenSnapshotChanges(resetDeps, clearSelection)

  useEffect(() => {
    if (selectedIds.size === 0) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") clearSelection()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedIds.size, clearSelection])

  const selection = useMemo<ListSelection>(
    () => ({
      selectedIds,
      onSelectAll: (select) => {
        if (select) {
          if (selectAllMerge) {
            setSelectedIds((prev) => {
              const next = new Set(prev)
              for (const id of selectAllIds) next.add(id)
              return next
            })
          } else {
            setSelectedIds(new Set(selectAllIds))
          }
          return
        }
        if (deselectAllPageScoped) {
          setSelectedIds((prev) => {
            const next = new Set(prev)
            for (const id of rowIds) next.delete(id)
            return next
          })
        } else {
          setSelectedIds(new Set())
        }
      },
      onSelectRow: (id, select) => {
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (select) next.add(id)
          else next.delete(id)
          return next
        })
      },
    }),
    [selectedIds, rowIds, selectAllIds, selectAllMerge, deselectAllPageScoped],
  )

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    selection,
    clearSelection,
  }
}
