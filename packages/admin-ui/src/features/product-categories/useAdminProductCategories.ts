import { useCallback, useEffect, useMemo, useState } from "react"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { buildHierarchyRowsFromCategories } from "./buildHierarchyRows"
import { listAdminProductCategories } from "./productCategoriesAdminApi"
import type { AdminProductCategoryHierarchyRow } from "./types"

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "config_error"; message: string }
  | { status: "error"; message: string }
  | { status: "success"; rows: AdminProductCategoryHierarchyRow[] }

export type UseAdminProductCategoriesResult = {
  state: LoadState
  /** Reloads from GET /admin/product-categories */
  reload: () => Promise<void>
  /** Flat hierarchical rows filtered by optional search query (matches name / handle / count). */
  filteredRows: AdminProductCategoryHierarchyRow[]
  /** Total ordered hierarchy rows returned from Medusa before search filter. */
  totalRowCount: number
  /** Current search applied to filteredRows. */
  search: string
  setSearch: (v: string) => void
}

function filterHierarchyRow(
  row: AdminProductCategoryHierarchyRow,
  query: string
): boolean {
  const t = query.trim().toLowerCase()
  if (t === "") {
    return true
  }
  return (
    row.name.toLowerCase().includes(t) ||
    row.handle.toLowerCase().includes(t) ||
    String(row.productCount).includes(t)
  )
}

export function useAdminProductCategories(searchQuery?: string): UseAdminProductCategoriesResult {
  const [state, setState] = useState<LoadState>({ status: "idle" })
  const [internalSearch, setInternalSearch] = useState("")
  const search = searchQuery ?? internalSearch
  const setSearch = searchQuery !== undefined ? (): void => {} : setInternalSearch

  const load = useCallback(async (): Promise<void> => {
    const backend = resolveMedusaAdminBackendUrl()
    if (backend === null) {
      setState({
        status: "config_error",
        message:
          "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Add packages/admin-ui/.env.local with your Medusa origin (for example http://localhost:9000).",
      })
      return
    }

    setState({ status: "loading" })

    try {
      const result = await listAdminProductCategories({ limit: 500 })
      const rows = buildHierarchyRowsFromCategories(result.categories)
      setState({ status: "success", rows })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load categories"
      setState({ status: "error", message })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredRows = useMemo((): AdminProductCategoryHierarchyRow[] => {
    if (state.status !== "success") {
      return []
    }
    return state.rows.filter((r) => filterHierarchyRow(r, search))
  }, [state, search])

  const totalRowCount = state.status === "success" ? state.rows.length : 0

  return {
    state,
    reload: load,
    filteredRows,
    totalRowCount,
    search,
    setSearch,
  }
}
