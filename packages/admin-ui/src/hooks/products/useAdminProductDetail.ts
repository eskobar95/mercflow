import { useMemo } from "react"

import { FetchError } from "@medusajs/js-sdk"
import type { AdminProduct } from "@medusajs/types"
import { useQuery } from "@tanstack/react-query"

import { ADMIN_PRODUCT_DETAIL_FIELDS } from "@/lib/products/adminProductFieldSets"
import { formatPriceRangeLabel } from "@/lib/products/mapAdminProductToListRow"
import { createMercflowMedusaSdk } from "@/medusa-admin/createMercflowMedusaSdk"

export type DetailVariantRow = {
  id: string
  name: string
  skuLabel: string
  priceLabel: string
  stockLabel: string
}

export function buildVariantRows(product: AdminProduct | null): DetailVariantRow[] {
  if (!product?.variants?.length) {
    return []
  }

  return product.variants.map((variant) => {
    const sku = variant.sku?.trim() ?? "—"
    const title = variant.title?.trim()
    const name =
      title && title.length > 0
        ? title
        : sku !== "—"
          ? sku
          : "Variant"
    const priceLabel = formatPriceRangeLabel(variant.prices ?? [])

    let stockLabel = "–"
    if (variant.manage_inventory === false) {
      stockLabel = "Not tracked"
    } else if (typeof variant.inventory_quantity === "number") {
      stockLabel = String(variant.inventory_quantity)
    }

    return {
      id: variant.id,
      name,
      skuLabel: sku,
      priceLabel,
      stockLabel,
    }
  })
}

export function useAdminProductDetail(productId: string | undefined): {
  data: AdminProduct | undefined
  isLoading: boolean
  errorMessage: string | null
  isNotAuthenticatedHint: boolean
} {
  const sdk = useMemo(() => createMercflowMedusaSdk(), [])
  const hasBackend = sdk !== null && productId !== undefined && productId !== ""

  const { data, isLoading, error } = useQuery({
    enabled: hasBackend && productId !== undefined,
    queryKey: ["admin-product-detail", productId, hasBackend],
    queryFn: async (): Promise<AdminProduct | null> => {
      if (!sdk || productId === undefined) {
        return null
      }
      const response = await sdk.admin.product.retrieve(productId, {
        fields: ADMIN_PRODUCT_DETAIL_FIELDS,
      })
      return response.product
    },
  })

  let errorMessage: string | null = null
  let authHint = false
  if (error instanceof FetchError && error.message !== "") {
    if (error.status === 401 || error.status === 403) {
      authHint = true
    }
    errorMessage = error.message
  } else if (error instanceof Error) {
    errorMessage = error.message
  }

  return {
    data: data ?? undefined,
    isLoading,
    errorMessage,
    isNotAuthenticatedHint: authHint,
  }
}
