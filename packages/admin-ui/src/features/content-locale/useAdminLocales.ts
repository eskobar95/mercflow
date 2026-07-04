import { useCallback, useEffect, useState } from "react"

import { useAdminAuthReady } from "@/components/auth/AdminAuthReadyContext"

import { listAdminLocales } from "./adminLocalesApi"
import type { AdminLocale } from "./types"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "An unexpected error occurred."
}

type UseAdminLocalesResult = {
  locales: AdminLocale[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/**
 * Loads available admin locales from `GET /admin/locales` once on mount.
 */
export function useAdminLocales(): UseAdminLocalesResult {
  const isAdminAuthReady = useAdminAuthReady()
  const [locales, setLocales] = useState<AdminLocale[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const next = await listAdminLocales()
      setLocales(next)
    } catch (e: unknown) {
      setError(toErrorMessage(e))
      setLocales([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdminAuthReady) {
      return
    }
    void reload()
  }, [isAdminAuthReady, reload])

  return { locales, loading, error, reload }
}
