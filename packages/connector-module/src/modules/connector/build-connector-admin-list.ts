import type {
  ConnectorAdminListItem,
  ConnectorConfigRecord,
  ConnectorConnectionHealth,
  ConnectorTypeSlug,
} from "./types"
import { CONNECTOR_TYPE_SLUGS } from "./types"

const CREDENTIAL_CIPHER_PREFIX = "mf1:"

function toIsoOrNull(value: Date | string | null | undefined): string | null {
  if (value == null) {
    return null
  }
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    return null
  }
  return d.toISOString()
}

function resolveStoredConnectionHealth(status: string | null | undefined): ConnectorConnectionHealth {
  const s = (status ?? "").trim().toLowerCase()
  if (s === "ok") {
    return "ok"
  }
  if (s === "error") {
    return "error"
  }
  return "untested"
}

function isConnectorTypeSlug(slug: string): slug is ConnectorTypeSlug {
  return (CONNECTOR_TYPE_SLUGS as readonly string[]).includes(slug)
}

/**
 * Builds a fixed-length list covering all MercFlow connector slugs so the admin UI can render a stable grid.
 */
export function buildConnectorAdminList(
  rows: ConnectorConfigRecord[]
): ConnectorAdminListItem[] {
  return CONNECTOR_TYPE_SLUGS.map((type) => {
    const row = rows.find((r) => {
      const slug = r.type.trim().toLowerCase()
      return isConnectorTypeSlug(slug) && slug === type
    })
    const encrypted = row?.credentials_encrypted?.trim() ?? ""
    const configured =
      encrypted.length > CREDENTIAL_CIPHER_PREFIX.length &&
      encrypted.startsWith(CREDENTIAL_CIPHER_PREFIX)
    const connectionHealth: ConnectorConnectionHealth | null =
      configured && row !== undefined
        ? resolveStoredConnectionHealth(row.connection_status ?? null)
        : null
    return {
      type,
      active: row !== undefined ? Boolean(row.active) : false,
      lastTestedAt: row ? toIsoOrNull(row.last_tested_at) : null,
      configured,
      connectionHealth,
    }
  })
}
