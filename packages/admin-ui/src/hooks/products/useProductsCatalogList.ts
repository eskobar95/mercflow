import { useMemo } from "react"

import type { QueryKey } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"

import { MOCK_PRODUCTS, type ProductListRow } from "@/data/mockProducts"
import { ADMIN_PRODUCT_LIST_FIELDS } from "@/lib/products/adminProductFieldSets"
import { mapAdminProductToListRow } from "@/lib/products/mapAdminProductToListRow"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

/** Map server sort indicator for Medusa Admin list (`order` query). */
function buildProductListOrder(
  columnId: keyof ProductSortColumnPayload | string | null,
  direction: "asc" | "desc" | "none"
): string | undefined {
  if (!columnId || direction === "none") {
    return "-updated_at"
  }
  const descending = direction === "desc"
  if (columnId === "updatedAt") {
    return descending ? "-updated_at" : "updated_at"
  }
  if (columnId === "title") {
    return descending ? "-title" : "title"
  }
  if (columnId === "status") {
    return descending ? "-status" : "status"
  }
  return "-updated_at"
}

import type { ProductStatus } from "@/components/product-list/productStatusMeta"

/** Catalogue status values, aligned with Medusa Admin `status` enum. */
export type ProductStatusValue = ProductStatus

export type ProductSortColumnPayload = Pick<ProductListRow, "title" | "status" | "updatedAt">

type ProductsListQueryResult = {
  rows: ProductListRow[]
  totalCount: number
  source: "medusa" | "mock"
}

type AdminProductWire = Parameters<typeof mapAdminProductToListRow>[0]

type UseProductsCatalogListArgs = {
  debouncedSearch: string
  /** Active status filter values; empty array means "all statuses". */
  statuses: ProductStatusValue[]
  page: number
  pageSize: number
  sortColumn: keyof ProductSortColumnPayload | null
  sortDirection: "asc" | "desc" | "none"
}

function getProductsCatalogQueryKey(args: Omit<UseProductsCatalogListArgs, "sortDirection">): QueryKey {
  return [
    "products-catalog-list",
    args.debouncedSearch,
    [...args.statuses].toSorted().join(","),
    args.page,
    args.pageSize,
    args.sortColumn,
  ]
}

export function useProductsCatalogList(args: UseProductsCatalogListArgs) {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])
  const hasBackend = sdk !== null

  const order = buildProductListOrder(args.sortColumn, args.sortDirection)

  return useQuery({
    queryKey: [
      ...getProductsCatalogQueryKey({
        debouncedSearch: args.debouncedSearch,
        statuses: args.statuses,
        page: args.page,
        pageSize: args.pageSize,
        sortColumn: args.sortColumn,
      }),
      args.sortDirection,
      hasBackend ? "sdk" : "mock",
      order ?? "-updated_at",
    ],
    queryFn: async (): Promise<ProductsListQueryResult> => {
      const offset = (args.page - 1) * args.pageSize

      const applyClientFiltersAndSort = (rows: ProductListRow[]): ProductListRow[] => {
        let list = [...rows]
        const q = args.debouncedSearch.trim().toLowerCase()
        if (q.length > 0) {
          list = list.filter((r) => r.title.toLowerCase().includes(q))
        }
        if (args.statuses.length > 0) {
          list = list.filter((r) => args.statuses.includes(r.status))
        }

        if (!args.sortColumn || args.sortDirection === "none") {
          return list.toSorted((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        }

        const col = args.sortColumn
        const dir = args.sortDirection === "asc" ? 1 : -1

        list.sort((a, b): number => {
          if (col === "updatedAt") {
            return (
              (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir
            )
          }
          if (col === "title") {
            return a.title.localeCompare(b.title) * dir
          }
          if (col === "status") {
            return a.status.localeCompare(b.status) * dir
          }
          return 0
        })

        return list
      }

      if (!sdk) {
        const sorted = applyClientFiltersAndSort(MOCK_PRODUCTS)
        const sliced = sorted.slice(offset, offset + args.pageSize)
        return {
          rows: sliced,
          totalCount: sorted.length,
          source: "mock",
        }
      }

      const { products, count } = await sdk.admin.product.list({
        limit: args.pageSize,
        offset,
        q: args.debouncedSearch.trim() !== "" ? args.debouncedSearch.trim() : undefined,
        ...(args.statuses.length > 0 ? { status: args.statuses } : {}),
        order,
        fields: ADMIN_PRODUCT_LIST_FIELDS,
      })

      let rows = (products ?? []).map((product, idx) =>
        mapAdminProductToListRow(product as AdminProductWire, idx + offset)
      )

      const q = args.debouncedSearch.trim().toLowerCase()
      if (q.length > 0) {
        rows = rows.filter((r) => r.title.toLowerCase().includes(q))
      }

      return {
        rows,
        totalCount: count ?? rows.length,
        source: "medusa",
      }
    },
  })
}
