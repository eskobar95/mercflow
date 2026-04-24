import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react"

import { compareSortValues, type ListColumnDef, type ListSortState } from "@/components/ui/list/types"

type UseMockEntityListStateArgs<TRow, TCol extends string> = {
  /** Pass `[]` to exercise the empty state, or a mock module export. */
  allRows: TRow[]
  columns: ListColumnDef<TRow, TCol>[]
  getRowId: (row: TRow) => string
  initialSort: ListSortState<TCol>
  filterRow: (row: TRow, query: string) => boolean
}

type UseMockEntityListStateReturn<TRow, TCol extends string> = {
  search: string
  setSearch: (v: string) => void
  page: number
  setPage: (p: number) => void
  pageSize: number
  setPageSize: (n: number) => void
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  sort: ListSortState<TCol>
  onRequestSort: (columnId: TCol) => void
  paged: TRow[]
  sorted: TRow[]
  currentPage: number
  selectedIds: Set<string>
  onSelectAll: (select: boolean) => void
  onSelectRow: (id: string, select: boolean) => void
}

/**
 * Client-only filter, sort, pagination, and selection for list pages until
 * a Medusa-backed hook replaces this. Swap `allRows` for fetched data in the
 * page component once API wiring exists.
 */
export function useMockEntityListState<TRow, TCol extends string>({
  allRows,
  columns,
  getRowId,
  initialSort,
  filterRow,
}: UseMockEntityListStateArgs<TRow, TCol>): UseMockEntityListStateReturn<TRow, TCol> {
  const [search, setSearchRaw] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set()
  )
  const [sort, setSort] = useState<ListSortState<TCol>>(initialSort)

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v)
    setPage(1)
  }, [])

  const onRequestSort = useCallback((columnId: TCol) => {
    setSort((s) => {
      if (s.column !== columnId) {
        return { column: columnId, direction: "asc" }
      }
      if (s.direction === "asc") {
        return { column: columnId, direction: "desc" }
      }
      if (s.direction === "desc") {
        return { column: null, direction: "none" }
      }
      return { column: columnId, direction: "asc" }
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) {
      return allRows
    }
    return allRows.filter((r) => filterRow(r, q))
  }, [allRows, search, filterRow])

  const sorted = useMemo(() => {
    if (!sort.column || sort.direction === "none") {
      return filtered
    }
    const def = columns.find((c) => c.id === sort.column)
    if (!def?.getSortValue) {
      return filtered
    }
    const dir = sort.direction === "asc" ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = def.getSortValue?.(a)
      const bv = def.getSortValue?.(b)
      if (av === undefined || bv === undefined) {
        return 0
      }
      return (
        compareSortValues(
          av as string | number | Date,
          bv as string | number | Date
        ) * dir
      )
    })
  }, [columns, filtered, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  const pageIds = useMemo(() => paged.map((r) => getRowId(r)), [paged, getRowId])

  const onSelectAll = useCallback(
    (select: boolean) => {
      setSelectedIds((prev) => {
        const n = new Set(prev)
        if (select) {
          for (const id of pageIds) {
            n.add(id)
          }
        } else {
          for (const id of pageIds) {
            n.delete(id)
          }
        }
        return n
      })
    },
    [pageIds]
  )

  const onSelectRow = useCallback((id: string, select: boolean) => {
    setSelectedIds((prev) => {
      const n = new Set(prev)
      if (select) {
        n.add(id)
      } else {
        n.delete(id)
      }
      return n
    })
  }, [])

  return {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    setIsLoading,
    sort,
    onRequestSort,
    paged,
    sorted,
    currentPage,
    selectedIds,
    onSelectAll,
    onSelectRow,
  }
}
