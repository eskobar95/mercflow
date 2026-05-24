import { useCallback, useEffect, useState } from "react"

import { listAllAdminProductCategories } from "@/features/product-categories/productCategoriesAdminApi"
import type { AdminProductCategoryParsed } from "@/features/product-categories/types"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

export type UseProductCategoryTreePicklistResult = {
  categories: AdminProductCategoryParsed[]
  loading: boolean
  errorMessage: string | null
  reload: () => Promise<void>
}

/**
 * Loads all product categories once for parent pickers (ordered tree derived via `buildHierarchyRowsFromCategories`).
 */
export function useProductCategoryTreePicklist(): UseProductCategoryTreePicklistResult {
  const [categories, setCategories] = useState<AdminProductCategoryParsed[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    const backend = resolveMedusaAdminBackendUrl()
    if (backend === null) {
      setErrorMessage(
        "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Add packages/admin-ui/.env.local with your Medusa origin (for example http://localhost:9000).",
      )
      setCategories([])
      return
    }

    setLoading(true)
    setErrorMessage(null)
    try {
      const all = await listAllAdminProductCategories()
      setCategories(all)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load categories"
      setErrorMessage(msg)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return {
    categories,
    loading,
    errorMessage,
    reload: load,
  }
}
