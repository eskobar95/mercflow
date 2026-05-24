import type { ConnectorAdminListItem, ConnectorAdminSlug } from "@/features/connectors/types"
import {
  buildMedusaAdminJsonHeaders,
  formatMedusaAdminHttpErrorMessageFromText,
  parseMedusaAdminJsonResponse,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

const CONNECTOR_SLUGS: readonly ConnectorAdminSlug[] = [
  "shipmondo",
  "stripe",
  "plunk",
  "gtm",
]

function isConnectorSlug(value: unknown): value is ConnectorAdminSlug {
  return (
    typeof value === "string" &&
    (CONNECTOR_SLUGS as readonly string[]).includes(value)
  )
}

function parseConnectorAdminListItem(row: unknown): ConnectorAdminListItem | null {
  if (typeof row !== "object" || row === null) {
    return null
  }

  const r = row as Record<string, unknown>
  if (!isConnectorSlug(r.type)) {
    return null
  }
  if (typeof r.configured !== "boolean" || typeof r.active !== "boolean") {
    return null
  }
  if (!("lastTestedAt" in r)) {
    return null
  }
  const lt = r.lastTestedAt
  if (lt !== null && typeof lt !== "string") {
    return null
  }

  return {
    type: r.type,
    active: r.active,
    configured: r.configured,
    lastTestedAt: lt,
  }
}

export function parseConnectorsListPayload(raw: unknown): ConnectorAdminListItem[] | null {
  if (typeof raw !== "object" || raw === null) {
    return null
  }
  const envelope = raw as Record<string, unknown>
  const dataUnknown = envelope.data
  if (!Array.isArray(dataUnknown)) {
    return null
  }

  const items: ConnectorAdminListItem[] = []
  for (const row of dataUnknown) {
    const parsed = parseConnectorAdminListItem(row)
    if (parsed === null) {
      return null
    }
    items.push(parsed)
  }
  if (items.length !== 4) {
    return null
  }
  return items
}

/**
 * Loads connector overview rows from MercFlow connector module (`GET /admin/connectors`).
 */
export async function fetchConnectorsAdminOverview(): Promise<ConnectorAdminListItem[]> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new TypeError(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}/admin/connectors`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      formatMedusaAdminHttpErrorMessageFromText(text, response.status, response.statusText)
    )
  }

  let json: unknown
  try {
    json = await parseMedusaAdminJsonResponse(response)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Malformed response"
    throw new Error(`${msg}: response is not usable JSON`)
  }

  const rows = parseConnectorsListPayload(json)
  if (rows === null) {
    throw new TypeError(
      "Malformed GET /admin/connectors response envelope (expected `{ data: [4 items ...] }`)"
    )
  }

  return rows
}
