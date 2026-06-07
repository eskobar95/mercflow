import type { ReactNode } from "react"
import {
  canonicalSubscriptionUiStatus,
  subscriptionStatusLabel,
  subscriptionStatusPillClassName,
} from "@/features/subscriptions"

type SubscriptionStatusBadgeProps = {
  status: string
}

/**
 * Renders canonical subscription statuses with preset-backed pill colors per MER-43.
 */
export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps): ReactNode {
  const key = canonicalSubscriptionUiStatus(status)
  return (
    <span className={subscriptionStatusPillClassName(key)}>{subscriptionStatusLabel(key)}</span>
  )
}
