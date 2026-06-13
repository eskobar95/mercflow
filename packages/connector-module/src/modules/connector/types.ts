export const CONNECTOR_TYPE_SLUGS = ["shipmondo", "plunk", "gtm"] as const

export type ConnectorTypeSlug = (typeof CONNECTOR_TYPE_SLUGS)[number]

export type ConnectorConfigRecord = {
  id: string
  type: string
  credentials_encrypted: string
  active: boolean
  last_tested_at: Date | null
  connection_status: string | null
  last_test_message: string | null
  rules_json: unknown | null
}

/** Admin + storefront-compatible presentation (camelCase) for Shipmondo shipping commerce rules. */
export type ShipmondoShippingRulesAdminDto = {
  markupAmountMinor: number
  freeShippingThresholdMinor: number
  enabledCarrierCodes: string[]
}

/** Sender + label output settings stored in connector_config.rules_json. */
export type ShipmondoLabelSettingsAdminDto = {
  senderName: string
  senderAddress1: string
  senderPostalCode: string
  senderCity: string
  senderCountryCode: string
  senderEmail: string
  senderPhone: string
  labelFormat: string
  ownAgreement: boolean
}

export type ShipmondoCreateLabelResultDto = {
  shipmentId: string | number
  trackingUrl: string | null
  labelPdfBase64: string | null
  productCode: string
  reference: string
}

/** One Shipmondo carrier product surfaced in MercFlow admin (fetch-carriers UX). */
export type ShipmondoCarrierProductAdminDto = {
  productCode: string
  carrierCode: string | null
  name: string
  basePriceMinor: number
}

/** Lightweight read-model for storefronts / checkout calculators. */
export type StoreShipmondoRulesDto = {
  active: boolean
} & ShipmondoShippingRulesAdminDto

export type ConnectorConnectionHealth = "ok" | "error" | "untested"
export type ConnectorAppStatus = "connected" | "error" | "not_configured"

export type ConnectorAdminListItem = {
  type: ConnectorTypeSlug
  active: boolean
  lastTestedAt: string | null
  configured: boolean
  connectionHealth: ConnectorConnectionHealth | null
  status: ConnectorAppStatus
}

export type PlunkCredentialsStored = {
  api_key: string
  from_email: string | null
  from_name: string | null
}

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
  createdAt: string
  message: string
  success: boolean
}

export type ShipmondoAdminGetDto = {
  type: "shipmondo"
  active: boolean
  lastTestedAt: string | null
  credentials: ShipmondoCredentialFlags
  recentLogs: ShipmondoAdminLogDto[]
  shippingRules: ShipmondoShippingRulesAdminDto
  labelSettings: ShipmondoLabelSettingsAdminDto
}

export type ShipmondoConnectionTestDto = {
  success: boolean
  message?: string
  error?: string
}

export type StoreShipmondoActiveDto = {
  active: boolean
}
