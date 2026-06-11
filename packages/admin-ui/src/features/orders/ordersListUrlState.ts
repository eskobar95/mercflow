import type { ActiveFilter } from "@/components/list-filter/types"
import type { ListSortState } from "@/components/ui/list/types"

import {
  ORDER_FILTER_CATEGORIES,
  deriveOrderFilterBuckets,
} from "@/features/orders/orderFilterCategories"
import type { OrdersListSortColumn } from "@/features/orders/orderListSortValues"

type OrdersListUrlSnapshot = {
  search: string
  activeFilters: ActiveFilter[]
  page: number
  pageSize: number
  dateFrom: string
  dateTo: string
  sort: ListSortState<OrdersListSortColumn>
}

function filterFromBucket(
  categoryId: "status" | "payment",
  bucket: string,
): ActiveFilter | null {
  if (bucket === "all") {
    return null
  }

  const category = ORDER_FILTER_CATEGORIES.find((entry) => entry.id === categoryId)
  if (!category) {
    return null
  }

  return {
    categoryId,
    operator: "is",
    valueIds: [bucket],
  }
}

export function serializeOrdersListSearchParams(snapshot: OrdersListUrlSnapshot): string {
  const params = new URLSearchParams()
  const trimmedSearch = snapshot.search.trim()

  if (trimmedSearch.length > 0) {
    params.set("q", trimmedSearch)
  }
  if (snapshot.page > 1) {
    params.set("page", String(snapshot.page))
  }
  if (snapshot.pageSize !== 10) {
    params.set("pageSize", String(snapshot.pageSize))
  }
  if (snapshot.dateFrom.length > 0) {
    params.set("dateFrom", snapshot.dateFrom)
  }
  if (snapshot.dateTo.length > 0) {
    params.set("dateTo", snapshot.dateTo)
  }
  if (snapshot.sort.column !== null && snapshot.sort.direction !== "none") {
    params.set("sortCol", snapshot.sort.column)
    params.set("sortDir", snapshot.sort.direction)
  }

  const { statusBucket, paymentBucket } = deriveOrderFilterBuckets(snapshot.activeFilters)
  if (statusBucket !== "all") {
    params.set("status", statusBucket)
  }
  if (paymentBucket !== "all") {
    params.set("payment", paymentBucket)
  }

  return params.toString()
}

export function parseOrdersListSearchParams(
  raw: URLSearchParams,
): Partial<OrdersListUrlSnapshot> {
  const parsed: Partial<OrdersListUrlSnapshot> = {}

  const search = raw.get("q")
  if (search !== null && search.trim().length > 0) {
    parsed.search = search
  }

  const page = raw.get("page")
  if (page !== null) {
    const value = Number.parseInt(page, 10)
    if (Number.isFinite(value) && value > 0) {
      parsed.page = value
    }
  }

  const pageSize = raw.get("pageSize")
  if (pageSize !== null) {
    const value = Number.parseInt(pageSize, 10)
    if (Number.isFinite(value) && value > 0) {
      parsed.pageSize = value
    }
  }

  const dateFrom = raw.get("dateFrom")
  if (dateFrom !== null && dateFrom.length > 0) {
    parsed.dateFrom = dateFrom
  }

  const dateTo = raw.get("dateTo")
  if (dateTo !== null && dateTo.length > 0) {
    parsed.dateTo = dateTo
  }

  const sortCol = raw.get("sortCol")
  const sortDir = raw.get("sortDir")
  if (
    sortCol !== null &&
    (sortDir === "asc" || sortDir === "desc")
  ) {
    parsed.sort = {
      column: sortCol as OrdersListSortColumn,
      direction: sortDir,
    }
  }

  const activeFilters: ActiveFilter[] = []
  const status = raw.get("status")
  if (status !== null) {
    const filter = filterFromBucket("status", status)
    if (filter) {
      activeFilters.push(filter)
    }
  }

  const payment = raw.get("payment")
  if (payment !== null) {
    const filter = filterFromBucket("payment", payment)
    if (filter) {
      activeFilters.push(filter)
    }
  }

  if (activeFilters.length > 0) {
    parsed.activeFilters = activeFilters
  }

  return parsed
}

export function buildOrdersListDetailPath(
  orderId: string,
  snapshot: OrdersListUrlSnapshot,
): string {
  const listQuery = serializeOrdersListSearchParams(snapshot)
  const detailPath = `/orders/${encodeURIComponent(orderId)}`
  if (listQuery.length === 0) {
    return detailPath
  }

  const params = new URLSearchParams()
  params.set("listReturn", listQuery)
  return `${detailPath}?${params.toString()}`
}

export type { OrdersListUrlSnapshot }
