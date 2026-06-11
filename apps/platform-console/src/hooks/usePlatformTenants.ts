import { useEffect, useState } from "react"

import type { PlatformTenant } from "@/lib/platformTenantsApi"
import { fetchPlatformTenants } from "@/lib/platformTenantsApi"

type TenantsLoadState =
  | { status: "loading" }
  | { status: "ok"; tenants: PlatformTenant[] }
  | { status: "error"; message: string }

export function usePlatformTenants(
  getToken: () => Promise<string | null>,
): {
  state: TenantsLoadState
  reload: () => void
} {
  const [reloadToken, setReloadToken] = useState(0)
  const [state, setState] = useState<TenantsLoadState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      setState({ status: "loading" })

      try {
        const tenants = await fetchPlatformTenants(getToken)
        if (!cancelled) {
          setState({ status: "ok", tenants })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "Failed to load tenants",
          })
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [getToken, reloadToken])

  return {
    state,
    reload: () => {
      setReloadToken((value) => value + 1)
    },
  }
}
