import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { subscriptionIntervalLabel } from "@/features/subscriptions/subscriptionInterval"
import type { SubscriptionInterval } from "@/features/subscriptions/types"

type SubscriptionIntervalBadgeProps = {
  interval: SubscriptionInterval
}

export function SubscriptionIntervalBadge({ interval }: SubscriptionIntervalBadgeProps): ReactNode {
  return (
    <Badge variant="neutral">{subscriptionIntervalLabel(interval)}</Badge>
  )
}
