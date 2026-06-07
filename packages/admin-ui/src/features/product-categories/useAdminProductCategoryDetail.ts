import { useCallback, useEffect, useState } from "react"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { retrieveAdminProductCategory } from "./productCategoriesAdminApi"
import type { AdminProductCategoryParsed } from "./types"

type DetailState =
  | { status: "idle" | "loading" }
  | { status: "config_error"; message: string }
  | { status: "error"; message: string }
  | { status: "not_found" }
  | { status: "success"; category: AdminProductCategoryParsed }

type UseAdminProductCategoryDetailResult = {
  state: DetailState
  reload: () => Promise<void>
}

export function useAdminProductCategoryDetail(
  categoryId: string | undefined
): UseAdminProductCategoryDetailResult {
  const [state, setState] = useState<DetailState>(
    categoryId ? { status: "loading" } : { status: "idle" }
  )

  const load = useCallback(async (): Promise<void> => {
    if (!categoryId) {
      setState({ status: "idle" })
      return
    }

    const backend = resolveMedusaAdminBackendUrl()
    if (backend === null) {
      setState({
        status: "config_error",
        message:
          "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Add packages/admin-ui/.env.local with your Medusa origin.",
      })
      return
    }

    setState({ status: "loading" })
    try {
      const cat = await retrieveAdminProductCategory(categoryId)
      if (!cat) {
        setState({ status: "not_found" })
        return
      }
      setState({ status: "success", category: cat })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load category"
      setState({ status: "error", message })
    }
  }, [categoryId])

  useEffect(() => {
    void load()
  }, [load])

  return { state, reload: load }
}
