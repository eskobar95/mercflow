import { useEffect, useRef, useState } from "react"

import { useAdjustStateWhenKeyChanges } from "@/lib/react/useAdjustStateWhenKeyChanges"
import { adminTokenStore } from "@/medusa-admin/adminTokenStore"

type GetTokenFn = () => Promise<string | null>

/**
 * Keeps `adminTokenStore` up to date with the current Clerk JWT for the active org.
 *
 * Returns `isTokenReady` only when a token has been fetched for the *current*
 * `organizationId`. Resets synchronously on org change so no child renders with a
 * stale ready flag while the store is empty.
 */
const TOKEN_REFRESH_INTERVAL_MS = 50_000

export function useAdminTokenSync(
  getToken: GetTokenFn | undefined,
  organizationId: string | null | undefined,
): { isTokenReady: boolean } {
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  const [readyOrganizationId, setReadyOrganizationId] = useState<string | null>(null)

  useAdjustStateWhenKeyChanges(organizationId, () => {
    setReadyOrganizationId(null)
    adminTokenStore.clear()
  })

  useEffect(() => {
    if (!getTokenRef.current || organizationId === null || organizationId === undefined) {
      return
    }

    const activeOrganizationId = organizationId
    let cancelled = false

    async function refresh(): Promise<void> {
      const fn = getTokenRef.current
      if (!fn || cancelled) return
      try {
        const token = await fn()
        if (token && !cancelled) {
          adminTokenStore.set(token)
          setReadyOrganizationId(activeOrganizationId)
        }
      } catch {
        // Keep waiting — interval or org change will retry.
      }
    }

    void refresh()
    const interval = setInterval(() => { void refresh() }, TOKEN_REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [organizationId])

  useEffect(() => {
    return () => {
      adminTokenStore.clear()
    }
  }, [])

  if (!getToken) {
    return { isTokenReady: true }
  }

  if (organizationId === null || organizationId === undefined) {
    return { isTokenReady: false }
  }

  const hasTokenForOrg =
    readyOrganizationId === organizationId && adminTokenStore.get() !== null

  return { isTokenReady: hasTokenForOrg }
}
