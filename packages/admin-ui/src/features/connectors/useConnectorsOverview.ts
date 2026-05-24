import { useCallback, useEffect, useState } from "react"

import { parseConnectorSlugParam } from "@/features/connectors/connectorPresentation"
import type { ConnectorAdminListItem } from "@/features/connectors/types"
import { fetchConnectorsAdminOverview } from "@/features/connectors/connectorsAdminApi"
import { resolveMedusaAdminBackendUrl } from "@/medusa-admin/medusaAdminFetch"

export type ConnectorOverviewBadgeLabel = "Active" | "Inactive" | "Not configured"

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "config_error"; message: string }
  | { status: "error"; message: string }
  | { status: "success"; items: ConnectorAdminListItem[] }

export type UseConnectorsOverviewResult = {
  state: LoadState
  reload: () => Promise<void>
}

export function connectorOverviewBadge(
  row: ConnectorAdminListItem,
): ConnectorOverviewBadgeLabel {
  if (!row.configured) {
    return "Not configured"
  }
  return row.active ? "Active" : "Inactive"
}

export function connectorDetailPath(type: ConnectorAdminListItem["type"]): string {
  return `/settings/connectors/${encodeURIComponent(type)}`
}

export function useConnectorDetailMeta(connectorSlug: string | undefined): {
  type: ConnectorAdminListItem["type"] | null
  title: string | null
} {
  const parsed = parseConnectorSlugParam(connectorSlug)
  if (!parsed) {
    return { type: null, title: null }
  }
  switch (parsed) {
    case "shipmondo":
      return { type: parsed, title: "Shipmondo" }
    case "stripe":
      return { type: parsed, title: "Stripe" }
    case "plunk":
      return { type: parsed, title: "Plunk" }
    case "gtm":
      return { type: parsed, title: "Google Tag Manager" }
    default:
      return { type: null, title: null }
  }
}

export function useConnectorsOverview(): UseConnectorsOverviewResult {
  const [state, setState] = useState<LoadState>({ status: "idle" })

  const reload = useCallback(async (): Promise<void> => {
    const backend = resolveMedusaAdminBackendUrl()
    if (backend === null) {
      setState({
        status: "config_error",
        message:
          "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Add packages/admin-ui/.env.local with your Medusa origin (for example http://localhost:9000).",
      })
      return
    }

    setState({ status: "loading" })
    try {
      const items = await fetchConnectorsAdminOverview()
      setState({ status: "success", items })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load connectors."
      setState({ status: "error", message })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { state, reload }
}
