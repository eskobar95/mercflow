import { useMemo } from "react"

import { useQuery } from "@tanstack/react-query"

import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

export type ProductEditorOptions = {
  collections: Array<{ value: string; label: string }>
  types: Array<{ value: string; label: string }>
  categories: Array<{ id: string; name: string }>
  isLoading: boolean
}

/**
 * Fetches the lists that back the Overview organisation selectors (collection,
 * type, categories). Cached independently of the product so switching products
 * does not refetch the option universe.
 */
export function useProductEditorOptions(): ProductEditorOptions {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])

  const { data, isLoading } = useQuery({
    enabled: sdk !== null,
    queryKey: ["product-editor-options"],
    queryFn: async () => {
      if (sdk === null) {
        return { collections: [], types: [], categories: [] }
      }
      const [collections, types, categories] = await Promise.all([
        sdk.admin.productCollection.list({ limit: 200, fields: "id,title" }),
        sdk.admin.productType.list({ limit: 200, fields: "id,value" }),
        sdk.admin.productCategory.list({ limit: 200, fields: "id,name" }),
      ])
      return {
        collections: (collections.collections ?? []).map((row) => ({
          value: row.id,
          label: row.title ?? row.id,
        })),
        types: (types.product_types ?? []).map((row) => ({
          value: row.id,
          label: row.value ?? row.id,
        })),
        categories: (categories.product_categories ?? []).map((row) => ({
          id: row.id,
          name: row.name ?? row.id,
        })),
      }
    },
  })

  return {
    collections: data?.collections ?? [],
    types: data?.types ?? [],
    categories: data?.categories ?? [],
    isLoading,
  }
}
