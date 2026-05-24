import { useEffect, useState } from "react"

import { getAdminConnectors } from "@/features/connectors/connectorsApi"
import type { ConnectorListItemDto } from "@/features/connectors/types"

type AdminConnectorsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; connectors: ConnectorListItemDto[] }

export function useAdminConnectors(): AdminConnectorsState {
  const [state, setState] = useState<AdminConnectorsState>({
    status: "loading",
  })

  useEffect(() => {
    let cancelled = false
    ;(async (): Promise<void> => {
      setState({ status: "loading" })
      try {
        const connectors = await getAdminConnectors()
        if (!cancelled) {
          setState({ status: "success", connectors })
        }
      } catch (e: unknown) {
        const message =
          e instanceof Error
            ? e.message
            : "Unable to load connectors. Check your backend URL and try again."
        if (!cancelled) {
          setState({ status: "error", message })
        }
      }
    })()
    return (): void => {
      cancelled = true
    }
  }, [])

  return state
}
