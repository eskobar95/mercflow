import type { ReactNode } from "react"
import { Navigate, useParams } from "react-router-dom"

import { UnifiedProductForm } from "@/components/products/UnifiedProductForm"

export function ProductEditPage(): ReactNode {
  const { productId } = useParams<{ productId: string }>()

  if (productId === undefined || productId.trim() === "") {
    return <Navigate replace to="/products" />
  }

  return <UnifiedProductForm mode="edit" productId={productId} />
}
