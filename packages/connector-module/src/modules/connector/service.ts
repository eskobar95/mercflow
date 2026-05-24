import { MedusaService } from "@medusajs/framework/utils"

import { buildConnectorAdminList } from "./build-connector-admin-list"
import { ConnectorConfig } from "./models/connector-config"
import { ConnectorLog } from "./models/connector-log"
import type { ConnectorAdminListItem } from "./types"

class ConnectorModuleService extends MedusaService({
  ConnectorConfig,
  ConnectorLog,
}) {
  /**
   * Returns all known connector types with configuration and status flags for the admin overview.
   */
  async listConnectorsForAdmin(): Promise<ConnectorAdminListItem[]> {
    const rows = await this.listConnectorConfigs({})
    return buildConnectorAdminList(rows)
  }
}

export default ConnectorModuleService
