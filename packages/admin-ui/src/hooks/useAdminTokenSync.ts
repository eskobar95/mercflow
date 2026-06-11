import { useEffect, useRef } from "react"

import { adminTokenStore } from "@/medusa-admin/adminTokenStore"

type GetTokenFn = () => Promise<string | null>

/**
 * Keeps `adminTokenStore` up to date with the current Clerk JWT.
 *
 * Call this once inside the authenticated shell. It fetches a fresh token on
 * mount and then refreshes every TOKEN_REFRESH_INTERVAL_MS so the store never
 * holds an expired token. Tokens are cleared on unmount (sign-out).
 *
 * When `getToken` is undefined (Clerk not configured) the hook is a no-op.
 */
const TOKEN_REFRESH_INTERVAL_MS = 50_000 // refresh every 50s (Clerk default TTL is 60s)

export function useAdminTokenSync(getToken: GetTokenFn | undefined): void {
  const getTokenRef = useRef(getToken)
  getTokenRef.current = getToken

  useEffect(() => {
    if (!getTokenRef.current) return

    let cancelled = false

    async function refresh(): Promise<void> {
      const fn = getTokenRef.current
      if (!fn || cancelled) return
      try {
        const token = await fn()
        if (token && !cancelled) {
          adminTokenStore.set(token)
        }
      } catch {
        // Clerk token fetch failed — keep existing token until next refresh.
      }
    }

    void refresh()
    const interval = setInterval(() => { void refresh() }, TOKEN_REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
      adminTokenStore.clear()
    }
  }, [])
}
