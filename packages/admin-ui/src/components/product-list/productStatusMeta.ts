import type { FilterValueTone } from "@/components/product-list/filter/types"

/** Medusa Admin product status enum — single source for filters, badges, and bulk actions. */
export const PRODUCT_STATUSES = ["published", "draft", "proposed"] as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

type ProductStatusMeta = {
  label: string
  filterTone: FilterValueTone
  dotClass: string
}

export const PRODUCT_STATUS_META: Record<ProductStatus, ProductStatusMeta> = {
  published: {
    label: "Published",
    filterTone: "success",
    dotClass: "bg-feedback-success",
  },
  draft: {
    label: "Draft",
    filterTone: "neutral",
    dotClass: "bg-content-tertiary",
  },
  proposed: {
    label: "Proposed",
    filterTone: "warning",
    dotClass: "bg-feedback-warning",
  },
}

export function isProductStatus(value: string): value is ProductStatus {
  return (PRODUCT_STATUSES as readonly string[]).includes(value)
}

/** Filter menu value rows — derived from {@link PRODUCT_STATUS_META}. */
export const PRODUCT_STATUS_FILTER_VALUES = PRODUCT_STATUSES.map((id) => ({
  id,
  label: PRODUCT_STATUS_META[id].label,
  tone: PRODUCT_STATUS_META[id].filterTone,
}))

/** Bulk "Set status" menu options — same labels as the badge/filter surfaces. */
export const PRODUCT_BULK_STATUS_OPTIONS = PRODUCT_STATUSES.map((value) => ({
  value,
  label: PRODUCT_STATUS_META[value].label,
}))
