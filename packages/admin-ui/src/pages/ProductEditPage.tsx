import type { ReactNode } from "react"
import { Navigate, useParams } from "react-router-dom"

/**
 * Legacy `/products/:id/edit` alias. Editing is now inline on the unified product
 * page, so this route permanently redirects to the detail page.
 */
export function ProductEditPage(): ReactNode {
  const { productId } = useParams<{ productId: string }>()

  if (productId === undefined || productId.trim() === "") {
    return <Navigate replace to="/products" />
  }

  return <Navigate replace to={`/products/${encodeURIComponent(productId)}`} />
}
