export const CONNECTOR_TYPE_SLUGS = ["shipmondo", "stripe", "plunk", "gtm"] as const

export type ConnectorTypeSlug = (typeof CONNECTOR_TYPE_SLUGS)[number]

export type ConnectorConfigRecord = {
  id: string
  type: string
  credentials_encrypted: string
  active: boolean
  last_tested_at: Date | null
  vat_mode: string
  secret_key_last4: string | null
  publishable_key_last4: string | null
  webhook_secret_last4: string | null
}

export type StripeVatMode = "inclusive" | "exclusive"

export type StripeConnectorAdminDto = {
  configured: boolean
  active: boolean
  vat_mode: StripeVatMode
  secret_key_masked: string | null
  publishable_key_masked: string | null
  webhook_secret_masked: string | null
  last_tested_at: string | null
}

/** Admin GET /admin/connectors item */
export type ConnectorAdminListItem = {
  type: ConnectorTypeSlug
  active: boolean
  /** ISO 8601 or null when never tested / not configured */
  lastTestedAt: string | null
  configured: boolean
}
