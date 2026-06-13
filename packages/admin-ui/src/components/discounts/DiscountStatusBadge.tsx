import type { ReactNode } from "react"

import type { DiscountStatus } from "@/features/discounts/types"

const STATUS_LABEL: Record<DiscountStatus, string> = {
  draft: "Draft",
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
}

const STATUS_CLASS: Record<DiscountStatus, string> = {
  draft:
    "inline-flex items-center rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-medium text-content-secondary",
  active:
    "inline-flex items-center rounded-full bg-feedback-success-subtle px-2 py-0.5 text-xs font-medium text-feedback-success-content",
  inactive:
    "inline-flex items-center rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-medium text-content-secondary",
  expired:
    "inline-flex items-center rounded-full bg-feedback-warning-subtle px-2 py-0.5 text-xs font-medium text-feedback-warning-content",
}

type DiscountStatusBadgeProps = {
  status: DiscountStatus
}

export function DiscountStatusBadge({ status }: DiscountStatusBadgeProps): ReactNode {
  return <span className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</span>
}
