import type { ReactNode } from "react"

import {
  PRODUCT_STATUS_META,
  type ProductStatus,
} from "@/components/product-list/productStatusMeta"
import { cn } from "@/lib/cn"

/**
 * Status indicator — a coloured dot plus label inside a hairline pill.
 * Status is conveyed by both colour and text for accessibility.
 */
export function ProductStatusBadge({ status }: { status: ProductStatus }): ReactNode {
  const { label, dotClass } = PRODUCT_STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-default px-2 py-0.5 text-xs font-medium text-content-secondary">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} aria-hidden />
      {label}
    </span>
  )
}
