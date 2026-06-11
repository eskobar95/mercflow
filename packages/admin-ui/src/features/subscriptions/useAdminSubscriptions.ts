import { useCallback, useEffect, useState } from "react"

import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"
import { useAdjustStateWhenSnapshotChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"

import { listAdminSubscriptions } from "./subscriptionsApi"
import type { AdminSubscriptionListResponse, AdminSubscriptionRow } from "./types"

export function useAdminSubscriptions(enabled: boolean): {
  data: AdminSubscriptionListResponse | null
  loading: boolean
  errorMessage: string | null
  refresh: () => Promise<void>
  replaceRow: (row: AdminSubscriptionRow) => void
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

  const replaceRow = useCallback((row: AdminSubscriptionRow): void => {
    setData((previous) => {
      if (previous === null) {
        return previous
      }
      return {
        ...previous,
        data: previous.data.map((entry) => (entry.id === row.id ? row : entry)),
      }
    })
  }, [])

  useAdjustStateWhenSnapshotChanges([enabled], () => {
    if (!enabled || resolveMedusaAdminBackendUrl() === null) {
      setLoading(false)
      setErrorMessage(null)
      setData(null)
    }
  })

  useEffect(() => {
    if (!enabled) {
      return
    }
    if (resolveMedusaAdminBackendUrl() === null) {
      return
    }
    void refresh()
  }, [enabled, refresh])

  return { data, loading, errorMessage, refresh, replaceRow }
}
