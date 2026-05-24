export const CONNECTOR_TYPE_SLUGS = ["shipmondo", "stripe", "plunk", "gtm"] as const

export type ConnectorTypeSlug = (typeof CONNECTOR_TYPE_SLUGS)[number]

export type ConnectorConfigRecord = {
  id: string
  type: string
  credentials_encrypted: string
  active: boolean
  last_tested_at: Date | null
}

/** Admin GET /admin/connectors item */
export type ConnectorAdminListItem = {
  type: ConnectorTypeSlug
  active: boolean
  /** ISO 8601 or null when never tested / not configured */
  lastTestedAt: string | null
  configured: boolean
}
