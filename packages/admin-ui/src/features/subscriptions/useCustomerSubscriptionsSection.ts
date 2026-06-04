import { useCallback, useEffect, useState } from "react"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

import { listCustomerSubscriptions } from "./subscriptionsApi"
import type { AdminSubscriptionListResponse } from "./types"

export function useCustomerSubscriptionsSection(customerId: string): {
  data: AdminSubscriptionListResponse | null
  loading: boolean
  errorMessage: string | null
  refresh: () => Promise<void>
} {
  const [data, setData] = useState<AdminSubscriptionListResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const enabled =
    customerId.trim().length > 0 && resolveMedusaAdminBackendUrl() !== null

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const envelope = await listCustomerSubscriptions(customerId, {
        limit: 50,
        offset: 0,
      })
      setData(envelope)
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Subscriptions could not be loaded.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      setErrorMessage(null)
      setData(null)
      return
    }
    void refresh()
  }, [enabled, refresh])

  return { data, loading, errorMessage, refresh }
}
