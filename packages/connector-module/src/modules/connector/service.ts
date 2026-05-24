import { MedusaService } from "@medusajs/framework/utils"

import { buildConnectorAdminList } from "./build-connector-admin-list"
import EncryptionService from "./encryption-service"
import { GtmConnector } from "./gtm-connector"
import { ConnectorConfig } from "./models/connector-config"
import { ConnectorLog } from "./models/connector-log"
import type { ConnectorAdminListItem } from "./types"

class ConnectorModuleService extends MedusaService({
  ConnectorConfig,
  ConnectorLog,
}) {
  private encryptionService: EncryptionService | null = null

  private getEncryptionService(): EncryptionService {
    if (this.encryptionService === null) {
      this.encryptionService = new EncryptionService()
    }
    return this.encryptionService
  }

  /**
   * Google Tag Manager connector entry point (encrypted credentials + upsert into `connector_config`).
   */
  gtm(): GtmConnector {
    return new GtmConnector(this, this.getEncryptionService())
  }

  /**
   * Returns all known connector types with configuration and status flags for the admin overview.
   */
  async listConnectorsForAdmin(): Promise<ConnectorAdminListItem[]> {
    const rows = await this.listConnectorConfigs({})
    return buildConnectorAdminList(rows)
  }
}

export default ConnectorModuleService
