import { useCallback, useEffect, useMemo, useState } from "react"

import { compareSortValues, type ListSortState } from "@/components/ui/list/types"
import { fetchAdminOrdersList, type OrdersListQuery } from "@/features/orders/ordersAdminApi"
import {
  ORDER_LIST_SORT_VALUE_GETTERS,
  type OrdersListSortColumn,
} from "@/features/orders/orderListSortValues"
import { orderMatchesStatusBucket } from "@/features/orders/orderStatusFilter"
import { orderMatchesPaymentBucket, type OrderPaymentFilterBucket } from "@/features/orders/orderPaymentFilter"
import type {
  OrderListRow,
  OrderStatusFilterBucket,
} from "@/features/orders/orderTypes"

const CHUNK_SIZE = 100
const MAX_LOAD = 800

type UseOrdersListArgs = {
  debouncedSearch: string
  statusBucket: OrderStatusFilterBucket
  paymentBucket: OrderPaymentFilterBucket
  dateFrom: string
  dateTo: string
  page: number
  pageSize: number
  sort: ListSortState<OrdersListSortColumn>
}

type UseOrdersListReturn = {
  rows: OrderListRow[]
  isLoading: boolean
  errorMessage: string | null
  refetch: () => void
  totalFiltered: number
}

function normalizeSearch(q: string): string {
  return q.trim().toLowerCase()
}

function rowMatchesSearch(row: OrderListRow, q: string): boolean {
  const n = normalizeSearch(q)
  if (!n) {
    return true
  }
  return (
    row.displayId.toLowerCase().includes(n) ||
    row.customerName.toLowerCase().includes(n) ||
    row.customerEmail.toLowerCase().includes(n) ||
    row.id.toLowerCase().includes(n)
  )
}

function sortRows(
  rows: OrderListRow[],
  sort: ListSortState<OrdersListSortColumn>
): OrderListRow[] {
  if (sort.column === null || sort.direction === "none") {
    return rows
  }
  const col = sort.column
  const getSortValue = ORDER_LIST_SORT_VALUE_GETTERS[col]
  const dir = sort.direction === "asc" ? 1 : -1
  const copied = [...rows]
  copied.sort((a, b) => {
    const va = getSortValue(a)
    const vb = getSortValue(b)
    return compareSortValues(va, vb) * dir
  })
  return copied
}

/**
 * Loads a capped window of orders from Medusa (`GET /admin/orders`),
 * applies date range server-side when supported, filters by UX bucket/search client-side,
 * then sorts and paginates locally.
 */
export function useOrdersList({
  debouncedSearch,
  statusBucket,
  paymentBucket,
  dateFrom,
  dateTo,
  page,
  pageSize,
  sort,
}: UseOrdersListArgs): UseOrdersListReturn {
  const [allRows, setAllRows] = useState<OrderListRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback((): void => {
    setReloadToken((x) => x + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async (): Promise<void> => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const baseQuery: Omit<OrdersListQuery, "offset" | "limit"> = {
          createdAtGte:
            dateFrom.trim() !== "" ? `${dateFrom.trim()}T00:00:00.000Z` : undefined,
          createdAtLte:
            dateTo.trim() !== "" ? `${dateTo.trim()}T23:59:59.999Z` : undefined,
        }
        const merged: OrderListRow[] = []
        let serverTotal: number | null = null
        for (let offset = 0; offset < MAX_LOAD; offset += CHUNK_SIZE) {
          const chunk = await fetchAdminOrdersList({
            ...baseQuery,
            limit: CHUNK_SIZE,
            offset,
          })
          if (serverTotal === null && typeof chunk.count === "number") {
            serverTotal = chunk.count
          }
          merged.push(...chunk.rows)
          if (chunk.rows.length < CHUNK_SIZE) {
            break
          }
          if (serverTotal !== null && merged.length >= serverTotal) {
            break
          }
          if (merged.length >= MAX_LOAD) {
            break
          }
        }
        if (!cancelled) {
          setAllRows(merged)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load orders"
        if (!cancelled) {
          setAllRows([])
          setErrorMessage(msg)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    void run()
    return (): void => {
      cancelled = true
    }
  }, [dateFrom, dateTo, reloadToken])

  const processed = useMemo(() => {
    const bucketed = allRows.filter((r) => orderMatchesStatusBucket(r, statusBucket))
    const paymentFiltered = bucketed.filter((r) =>
      orderMatchesPaymentBucket(r, paymentBucket)
    )
    const searched = paymentFiltered.filter((r) => rowMatchesSearch(r, debouncedSearch))
    return sortRows(searched, sort)
  }, [allRows, statusBucket, paymentBucket, debouncedSearch, sort])

  const totalFiltered = processed.length

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return processed.slice(start, start + pageSize)
  }, [processed, page, pageSize])

  return {
    rows: paged,
    isLoading,
    errorMessage,
    refetch,
    totalFiltered,
  }
}
