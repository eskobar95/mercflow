import { MedusaService } from "@medusajs/framework/utils"

import EncryptionService from "./encryption-service"
import { ConnectorConfig } from "./models/connector-config"
import { ConnectorLog } from "./models/connector-log"
import type {
  ConnectorConfigPlain,
  ConnectorType,
  SaveConnectorConfigInput,
} from "./types"

type ConnectorConfigRow = {
  id: string
  type: ConnectorType
  credentials_encrypted: string
  active: boolean
  created_at: Date
  updated_at: Date
}

class ConnectorConfigService extends MedusaService({
  ConnectorConfig,
  ConnectorLog,
}) {
  private readonly encryption: EncryptionService

  constructor(container: object, options?: { encryption?: EncryptionService }) {
    super(container)
    this.encryption = options?.encryption ?? new EncryptionService()
  }

  private mapRowToPlain(row: ConnectorConfigRow): ConnectorConfigPlain {
    return {
      id: row.id,
      type: row.type,
      credentials: this.encryption.decrypt(row.credentials_encrypted),
      active: row.active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  }

  async save(input: SaveConnectorConfigInput): Promise<ConnectorConfigPlain> {
    const encrypted = this.encryption.encrypt(input.credentials)
    const existingRows = await this.listConnectorConfigs({ type: input.type })
    const existing = existingRows[0]

    if (existing) {
      const updated = await this.updateConnectorConfigs({
        id: existing.id,
        credentials_encrypted: encrypted,
        ...(input.active !== undefined ? { active: input.active } : {}),
      })
      const row = Array.isArray(updated) ? updated[0] : updated
      return this.mapRowToPlain(row as ConnectorConfigRow)
    }

    const created = await this.createConnectorConfigs({
      type: input.type,
      credentials_encrypted: encrypted,
      active: input.active ?? true,
    })
    const row = Array.isArray(created) ? created[0] : created
    return this.mapRowToPlain(row as ConnectorConfigRow)
  }

  async get(id: string): Promise<ConnectorConfigPlain> {
    const row = await this.retrieveConnectorConfig(id)
    return this.mapRowToPlain(row as ConnectorConfigRow)
  }

  async list(): Promise<ConnectorConfigPlain[]> {
    const rows = await this.listConnectorConfigs()
    return rows.map((row) => this.mapRowToPlain(row as ConnectorConfigRow))
  }

  async setActive(id: string, active: boolean): Promise<ConnectorConfigPlain> {
    await this.retrieveConnectorConfig(id)
    const updated = await this.updateConnectorConfigs({ id, active })
    const row = Array.isArray(updated) ? updated[0] : updated
    return this.mapRowToPlain(row as ConnectorConfigRow)
  }
}

export default ConnectorConfigService
