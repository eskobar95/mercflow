import { useCallback, useState } from "react"

import {
  cancelAdminSubscription,
  pauseAdminSubscription,
  resumeAdminSubscription,
} from "./subscriptionsApi"
import type { AdminSubscriptionRow } from "./types"

type UseSubscriptionStatusActionsOptions = {
  onOptimisticStatus: (subscriptionId: string, status: string) => void
  onConfirmedUpdate: (row: AdminSubscriptionRow) => void
  onRevert: () => void
}

export function useSubscriptionStatusActions({
  onOptimisticStatus,
  onConfirmedUpdate,
  onRevert,
}: UseSubscriptionStatusActionsOptions): {
  actionError: string | null
  isMutating: boolean
  clearActionError: () => void
  pause: (subscriptionId: string, pauseUntil?: string | null) => Promise<boolean>
  cancel: (subscriptionId: string) => Promise<boolean>
  resume: (subscriptionId: string) => Promise<boolean>
} {
  const [actionError, setActionError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState<boolean>(false)

  const clearActionError = useCallback((): void => {
    setActionError(null)
  }, [])

  const runMutation = useCallback(
    async (
      subscriptionId: string,
      optimisticStatus: string,
      request: () => Promise<AdminSubscriptionRow>
    ): Promise<boolean> => {
      setActionError(null)
      setIsMutating(true)
      onOptimisticStatus(subscriptionId, optimisticStatus)
      try {
        const row = await request()
        onConfirmedUpdate(row)
        return true
      } catch (e: unknown) {
        onRevert()
        setActionError(e instanceof Error ? e.message : "Subscription update failed.")
        return false
      } finally {
        setIsMutating(false)
      }
    },
    [onConfirmedUpdate, onOptimisticStatus, onRevert]
  )

  const pause = useCallback(
    async (subscriptionId: string, pauseUntil?: string | null): Promise<boolean> => {
      return runMutation(subscriptionId, "paused", () =>
        pauseAdminSubscription(subscriptionId, { pause_until: pauseUntil ?? null })
      )
    },
    [runMutation]
  )

  const cancel = useCallback(
    async (subscriptionId: string): Promise<boolean> => {
      return runMutation(subscriptionId, "cancelled", () => cancelAdminSubscription(subscriptionId))
    },
    [runMutation]
  )

  const resume = useCallback(
    async (subscriptionId: string): Promise<boolean> => {
      return runMutation(subscriptionId, "active", () => resumeAdminSubscription(subscriptionId))
    },
    [runMutation]
  )

  return {
    actionError,
    isMutating,
    clearActionError,
    pause,
    cancel,
    resume,
  }
}
