import { useCallback, useEffect, useMemo, useState } from "react"

import { compareSortValues, type ListSortState } from "@/components/ui/list/types"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { customerDisplayName } from "../customerFormatting"
import {
  CustomersAdminConfigError,
  fetchCustomerPaidSpendSummary,
  listCustomers,
} from "../customersAdminApi"
import type { AdminCustomer } from "../customersAdminTypes"
import type { CustomerPaidSpendSummary } from "../customersAdminTypes"
import {
  summarizeLifetimeDisplayText,
} from "../customersPaidSpend"

type CustomersSpendCellState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready"; readonly summary: CustomerPaidSpendSummary }

export type CustomersDirectoryRow = {
  readonly customer: AdminCustomer
  readonly spend: CustomersSpendCellState
}

export type CustomersDirectorySortCol =
  | "name"
  | "email"
  | "orderCount"
  | "lifetime"
  | "joined"

const DEBOUNCE_MS = 320

function orderCountSortValue(row: CustomersDirectoryRow): number {
  if (row.spend.status !== "ready") {
    return Number.NEGATIVE_INFINITY
  }
  return row.spend.summary.totalOrderCount
}

function lifetimeMinorSortKey(row: CustomersDirectoryRow): bigint {
  if (row.spend.status !== "ready") {
    return -1n
  }
  const view = summarizeLifetimeDisplayText(row.spend.summary)
  if (view.kind !== "single") {
    return 0n
  }
  return view.minor
}

function sortRows(
  rows: CustomersDirectoryRow[],
  sort: ListSortState<CustomersDirectorySortCol>
): CustomersDirectoryRow[] {
  if (sort.direction === "none" || sort.column === null) {
    return rows
  }
  const multiplier = sort.direction === "desc" ? -1 : 1
  const copy = rows.slice()

  copy.sort((a, b) => {
    switch (sort.column) {
      case "name":
        return (
          multiplier *
          compareSortValues(customerDisplayName(a.customer).toLocaleLowerCase(), customerDisplayName(b.customer).toLocaleLowerCase())
        )
      case "email":
        return (
          multiplier *
          compareSortValues(
            (a.customer.email ?? "").toLocaleLowerCase(),
            (b.customer.email ?? "").toLocaleLowerCase()
          )
        )
      case "orderCount":
        return multiplier * (orderCountSortValue(a) - orderCountSortValue(b))
      case "lifetime": {
        const left = lifetimeMinorSortKey(a)
        const right = lifetimeMinorSortKey(b)
        if (left === right) {
          return 0
        }
        const ordered = left < right ? -1 : 1
        return multiplier * ordered
      }
      case "joined":
        return (
          multiplier *
          compareSortValues(new Date(a.customer.created_at), new Date(b.customer.created_at))
        )
      default:
        return 0
    }
  })

  return copy
}

export function useCustomersDirectory(): {
  readonly hasBackendConfiguration: boolean
  readonly searchInput: string
  readonly setSearchInput: (next: string) => void
  readonly debouncedQuery: string
  readonly rows: CustomersDirectoryRow[]
  readonly sortedRows: CustomersDirectoryRow[]
  readonly isListLoading: boolean
  readonly listError: string | null
  readonly totalCount: number
  readonly currentPage: number
  readonly pageSize: number
  readonly setCurrentPage: (page: number) => void
  readonly setPageSize: (next: number) => void
  readonly sort: ListSortState<CustomersDirectorySortCol>
  readonly requestSort: (column: CustomersDirectorySortCol) => void
} {
  const hasBackendConfiguration = resolveMedusaAdminBackendUrl() !== null

  const [searchInput, setSearchInputState] = useState("")
  const debouncedQuery = useDebouncedValue(searchInput.trim(), DEBOUNCE_MS)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [listError, setListError] = useState<string | null>(null)
  const [isListLoading, setIsListLoading] = useState(false)

  const [spendStates, setSpendStates] = useState<Record<string, CustomersSpendCellState>>({})
  const [sort, setSort] = useState<ListSortState<CustomersDirectorySortCol>>({
    column: null,
    direction: "none",
  })

  const setSearchInput = useCallback((next: string): void => {
    setSearchInputState(next)
    setCurrentPage(1)
  }, [])

  const requestSort = useCallback((column: CustomersDirectorySortCol): void => {
    setSort((previous) => {
      if (previous.column !== column) {
        return { column, direction: "asc" }
      }
      if (previous.direction === "asc") {
        return { column, direction: "desc" }
      }
      if (previous.direction === "desc") {
        return { column: null, direction: "none" }
      }
      return { column, direction: "asc" }
    })
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedQuery])

  useEffect(() => {
    if (!hasBackendConfiguration) {
      setCustomers([])
      setSpendStates({})
      setTotalCount(0)
      setListError(null)
      setIsListLoading(false)
      return
    }

    const controller = new AbortController()

    async function load(): Promise<void> {
      setIsListLoading(true)
      setListError(null)
      try {
        const offset = (currentPage - 1) * pageSize
        const envelope = await listCustomers({
          q: debouncedQuery === "" ? undefined : debouncedQuery,
          limit: pageSize,
          offset,
          signal: controller.signal,
        })
        if (controller.signal.aborted) {
          return
        }
        setCustomers(envelope.customers)
        setTotalCount(envelope.count)
        setSpendStates(() => {
          const nextSpend: Record<string, CustomersSpendCellState> = {}
          for (const customer of envelope.customers) {
            nextSpend[customer.id] = { status: "loading" }
          }
          return nextSpend
        })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        if (error instanceof CustomersAdminConfigError) {
          setListError(error.message)
        } else if (error instanceof Error) {
          setListError(error.message)
        } else {
          setListError("Failed to load customers")
        }
        setCustomers([])
        setTotalCount(0)
      } finally {
        if (!controller.signal.aborted) {
          setIsListLoading(false)
        }
      }
    }

    void load()

    return (): void => {
      controller.abort()
    }
  }, [currentPage, debouncedQuery, hasBackendConfiguration, pageSize])

  useEffect(() => {
    if (!hasBackendConfiguration) {
      return
    }

    const controllers = customers.map(() => new AbortController())

    customers.forEach((customer, index) => {
      const signal = controllers[index]?.signal

      async function hydrateSpend(): Promise<void> {
        if (!signal || signal.aborted) {
          return
        }

        try {
          const summary = await fetchCustomerPaidSpendSummary(customer.id, {
            signal,
          })

          setSpendStates((previous) => {
            return {
              ...previous,
              [customer.id]: { status: "ready", summary },
            }
          })
        } catch (error) {
          if (signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
            return
          }
          const message = error instanceof Error ? error.message : "Failed to load spend data"
          setSpendStates((previous) => {
            return {
              ...previous,
              [customer.id]: { status: "error", message },
            }
          })
        }
      }

      void hydrateSpend()
    })

    return (): void => {
      controllers.forEach((entry) => {
        entry.abort()
      })
    }
  }, [customers, hasBackendConfiguration])

  const rows = useMemo((): CustomersDirectoryRow[] => {
    return customers.map((customer) => {
      const spend = spendStates[customer.id]
      const normalized: CustomersSpendCellState =
        spend === undefined ? { status: "loading" } : spend
      return { customer, spend: normalized }
    })
  }, [customers, spendStates])

  const sortedRows = useMemo((): CustomersDirectoryRow[] => {
    return sortRows(rows, sort)
  }, [rows, sort])

  const setPageSizeBounded = useCallback((next: number): void => {
    setPageSize(next)
    setCurrentPage(1)
  }, [])

  return {
    hasBackendConfiguration,
    searchInput,
    setSearchInput,
    debouncedQuery,
    rows,
    sortedRows,
    isListLoading,
    listError,
    totalCount,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize: setPageSizeBounded,
    sort,
    requestSort,
  }
}
