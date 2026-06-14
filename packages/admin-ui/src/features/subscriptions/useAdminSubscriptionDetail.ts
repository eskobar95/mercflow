import { useCallback, useEffect, useState } from "react"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"
import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

import { getAdminSubscription } from "./subscriptionsApi"
import type { AdminSubscriptionDetail, AdminSubscriptionRow } from "./types"

export function useAdminSubscriptionDetail(subscriptionId: string | undefined): {
  detail: AdminSubscriptionDetail | null
  loading: boolean
  errorMessage: string | null
  refresh: () => Promise<void>
  replaceSubscription: (row: AdminSubscriptionRow) => void
} {
  const [detail, setDetail] = useState<AdminSubscriptionDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    if (subscriptionId === undefined || subscriptionId.trim() === "") {
      setDetail(null)
      setErrorMessage("Missing subscription identifier.")
      setLoading(false)
      return
    }
    setLoading(true)
    setErrorMessage(null)
    try {
      const next = await getAdminSubscription(subscriptionId)
      setDetail(next)
    } catch (e: unknown) {
      setDetail(null)
      setErrorMessage(e instanceof Error ? e.message : "Subscription could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [subscriptionId])

  const replaceSubscription = useCallback((row: AdminSubscriptionRow): void => {
    setDetail((previous) => {
      if (previous === null || previous.id !== row.id) {
        return previous
      }
      return {
        ...previous,
        ...row,
      }
    })
  }, [])

  useAdjustStateWhenKeyChanges(subscriptionId ?? "", () => {
    setDetail(null)
    setLoading(false)
    if (resolveMedusaAdminBackendUrl() === null) {
      setErrorMessage(
        "Missing backend URL. Configure VITE_MEDUSA_ADMIN_BACKEND_URL to load subscription data."
      )
    } else {
      setErrorMessage(null)
    }
  })

  useEffect(() => {
    if (subscriptionId === undefined || subscriptionId.trim() === "") {
      return
    }
    if (resolveMedusaAdminBackendUrl() === null) {
      return
    }
    void refresh()
  }, [refresh, subscriptionId])

  return { detail, loading, errorMessage, refresh, replaceSubscription }
}
