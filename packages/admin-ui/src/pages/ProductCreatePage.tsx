import type { ReactNode } from "react"
import { UnifiedProductForm } from "@/components/products/UnifiedProductForm"

export function ProductCreatePage(): ReactNode {
  return <UnifiedProductForm mode="create" />
}
