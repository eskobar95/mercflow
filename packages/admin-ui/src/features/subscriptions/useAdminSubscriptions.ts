import { useCallback, useEffect, useState } from "react"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { listAdminSubscriptions } from "./subscriptionsApi"
import type { AdminSubscriptionListResponse } from "./types"

export function useAdminSubscriptions(enabled: boolean): {
  data: AdminSubscriptionListResponse | null
  loading: boolean
  errorMessage: string | null
  refresh: () => Promise<void>
} {
  const [data, setData] = useState<AdminSubscriptionListResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const envelope = await listAdminSubscriptions({
        limit: 100,
        offset: 0,
      })
      setData(envelope)
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Subscriptions could not be loaded.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setErrorMessage(null)
      setData(null)
      return
    }
    if (resolveMedusaAdminBackendUrl() === null) {
      setLoading(false)
      setErrorMessage(null)
      setData(null)
      return
    }
    void refresh()
  }, [enabled, refresh])

  return { data, loading, errorMessage, refresh }
}
