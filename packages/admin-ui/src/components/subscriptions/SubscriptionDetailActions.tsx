import type { ReactNode } from "react"

import { Button } from "@/components/ui/Button"
import {
  subscriptionCanCancel,
  subscriptionCanPause,
  subscriptionCanResume,
} from "@/features/subscriptions/subscriptionUi"
import type { AdminSubscriptionRow } from "@/features/subscriptions/types"

type SubscriptionDetailActionsProps = {
  subscription: AdminSubscriptionRow
  isMutating: boolean
  onPause: () => void
  onCancel: () => void
  onResume: () => void
}

export function SubscriptionDetailActions({
  subscription,
  isMutating,
  onPause,
  onCancel,
  onResume,
}: SubscriptionDetailActionsProps): ReactNode {
  const canPause = subscriptionCanPause(subscription.status)
  const canResume = subscriptionCanResume(subscription.status)
  const canCancel = subscriptionCanCancel(subscription.status)

  if (!canPause && !canResume && !canCancel) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canResume ? (
        <Button type="button" variant="primary" disabled={isMutating} onClick={onResume}>
          Resume
        </Button>
      ) : null}
      {canPause ? (
        <Button type="button" variant="secondary" disabled={isMutating} onClick={onPause}>
          Pause
        </Button>
      ) : null}
      {canCancel ? (
        <Button type="button" variant="destructive" disabled={isMutating} onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </div>
  )
}
