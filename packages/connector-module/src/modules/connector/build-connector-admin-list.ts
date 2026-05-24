import type { ConnectorAdminListItem, ConnectorConfigRecord, ConnectorTypeSlug } from "./types"
import { CONNECTOR_TYPE_SLUGS } from "./types"

function isConnectorTypeSlug(value: string): value is ConnectorTypeSlug {
  return (CONNECTOR_TYPE_SLUGS as readonly string[]).includes(value)
}

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

/**
 * Builds a fixed-length list covering all MercFlow connector slugs so the admin UI can render a stable grid.
 */
export function buildConnectorAdminList(
  rows: ConnectorConfigRecord[]
): ConnectorAdminListItem[] {
  const bySlug = new Map<
    ConnectorTypeSlug,
    { active: boolean; lastTestedAt: string | null }
  >()

  for (const row of rows) {
    const slug = row.type.trim().toLowerCase()
    if (!isConnectorTypeSlug(slug)) {
      continue
    }
    bySlug.set(slug, {
      active: Boolean(row.active),
      lastTestedAt: toIsoOrNull(row.last_tested_at),
    })
  }

  return CONNECTOR_TYPE_SLUGS.map((type) => {
    const found = bySlug.get(type)
    return {
      type,
      active: found?.active ?? false,
      lastTestedAt: found?.lastTestedAt ?? null,
      configured: found !== undefined,
    }
  })
}
