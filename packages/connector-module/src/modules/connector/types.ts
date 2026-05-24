import { ConnectorTypeEnum } from "./models/connector-config"

export type ConnectorType =
  (typeof ConnectorTypeEnum)[keyof typeof ConnectorTypeEnum]

/**
 * Canonical order for GET /admin/connectors and the admin connectors grid.
 */
export const CONNECTOR_ADMIN_ORDERED_TYPES: readonly ConnectorType[] = [
  ConnectorTypeEnum.SHIPMONDO,
  ConnectorTypeEnum.STRIPE,
  ConnectorTypeEnum.PLUNK,
  ConnectorTypeEnum.GTM,
]

/**
 * One row for the admin connectors overview (no decrypted credentials).
 */
export type ConnectorAdminListItem = {
  type: ConnectorType
  active: boolean
  lastTestedAt: string | null
  configured: boolean
}

/**
 * Resolved connector row with decrypted credentials (never persist this shape).
 */
export type ConnectorConfigPlain = {
  id: string
  type: ConnectorType
  credentials: string
  active: boolean
  created_at: Date
  updated_at: Date
}

export type SaveConnectorConfigInput = {
  type: ConnectorType
  credentials: string
  active?: boolean
}
