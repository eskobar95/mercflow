import { ConnectorTypeEnum } from "./models/connector-config"

export type ConnectorType =
  (typeof ConnectorTypeEnum)[keyof typeof ConnectorTypeEnum]

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
