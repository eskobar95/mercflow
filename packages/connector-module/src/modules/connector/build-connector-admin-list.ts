import type {
  ConnectorAdminListItem,
  ConnectorAppStatus,
  ConnectorConfigRecord,
  ConnectorConnectionHealth,
  ConnectorTypeSlug,
} from "./types"
import { CONNECTOR_TYPE_SLUGS } from "./types"

const CREDENTIAL_CIPHER_PREFIX = "mf1:"
const VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000

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

/** Maps stored connector rows to the Apps overview status contract (T078). */
export function resolveConnectorAppStatus(input: {
  configured: boolean
  connectionHealth: ConnectorConnectionHealth | null
  lastTestedAt: string | null
  now?: Date
}): ConnectorAppStatus {
  if (!input.configured) {
    return "not_configured"
  }
  if (input.connectionHealth === "error") {
    return "error"
  }
  if (input.lastTestedAt !== null) {
    const testedAt = new Date(input.lastTestedAt)
    const now = input.now ?? new Date()
    if (
      !Number.isNaN(testedAt.getTime()) &&
      now.getTime() - testedAt.getTime() <= VERIFICATION_WINDOW_MS
    ) {
      return "connected"
    }
  }
  return "not_configured"
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
    const lastTestedAt = row ? toIsoOrNull(row.last_tested_at) : null
    return {
      type,
      active: row !== undefined ? Boolean(row.active) : false,
      lastTestedAt,
      configured,
      connectionHealth,
      status: resolveConnectorAppStatus({
        configured,
        connectionHealth,
        lastTestedAt,
      }),
    }
  })
}
