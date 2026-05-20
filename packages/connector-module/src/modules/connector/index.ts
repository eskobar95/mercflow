import { Module } from "@medusajs/framework/utils"

import ConnectorConfigService from "./service"

export const CONNECTOR_MODULE = "connector"

export { default as EncryptionService } from "./encryption-service"
export type { EncryptionServiceOptions } from "./encryption-service"
export type {
  ConnectorConfigPlain,
  ConnectorType,
  SaveConnectorConfigInput,
} from "./types"
export { ConnectorTypeEnum } from "./models/connector-config"

export default Module(CONNECTOR_MODULE, {
  service: ConnectorConfigService,
})
