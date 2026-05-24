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
  connection_status: string | null
  last_test_message: string | null
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

/** Last connectivity probe outcome for list badges (only meaningful when configured). */
export type ConnectorConnectionHealth = "ok" | "error" | "untested"

/** Admin GET /admin/connectors item */
export type ConnectorAdminListItem = {
  type: ConnectorTypeSlug
  active: boolean
  /** ISO 8601 or null when never tested / not configured */
  lastTestedAt: string | null
  configured: boolean
  /**
   * When `configured` is false, this is always `null`. Otherwise reflects stored probe state.
   */
  connectionHealth: ConnectorConnectionHealth | null
}

/** Encrypted payload structure for connector type `plunk`. */
export type PlunkCredentialsStored = {
  api_key: string
  from_email: string | null
  from_name: string | null
}

/** Admin GET /admin/connectors/plunk */
export type PlunkAdminConnectorState = {
  type: "plunk"
  configured: boolean
  active: boolean
  apiKeyMasked: string | null
  fromEmail: string | null
  fromName: string | null
  connectionHealth: ConnectorConnectionHealth | null
  lastTestedAt: string | null
  lastTestMessage: string | null
}

/** POST /admin/connectors/plunk/test */
export type PlunkConnectionTestResult = {
  success: boolean
  message: string
}

export type ShipmondoCredentialFlags = {
  apiUserConfigured: boolean
  apiKeyConfigured: boolean
  shippingModuleKeyConfigured: boolean
}

export type ShipmondoAdminLogDto = {
  id: string
  /** ISO timestamp */
  createdAt: string
  /** Human-readable outcome (no secrets). */
  message: string
  /** Whether the Shipmondo API returned a success-class HTTP status during the probe. */
  success: boolean
}

export type ShipmondoAdminGetDto = {
  type: "shipmondo"
  active: boolean
  lastTestedAt: string | null
  credentials: ShipmondoCredentialFlags
  recentLogs: ShipmondoAdminLogDto[]
}

export type ShipmondoConnectionTestDto = {
  success: boolean
  message?: string
  error?: string
}

export type StoreShipmondoActiveDto = {
  /** True when Shipmondo is configured with credentials AND marked active — storefront should expose rates. */
  active: boolean
}
