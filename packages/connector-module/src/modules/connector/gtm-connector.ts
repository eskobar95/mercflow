import { MedusaError } from "@medusajs/utils"

import EncryptionService from "./encryption-service"
import { gtmContainerIdValueSchema } from "./http-schemas"
import {
  parseDecryptedGtmCredentials,
  serializeGtmCredentials,
  type GtmCredentialsPayload,
} from "./gtm-credentials"
import type { ConnectorConfigRecord } from "./types"

const GTM_CONNECTOR_TYPE = "gtm"

type ConnectorConfigServiceApi = {
  listConnectorConfigs(filter: { type: string }): Promise<unknown>
  createConnectorConfigs(
    data:
      | Record<string, unknown>
      | Record<string, unknown>[]
  ): Promise<unknown>
  updateConnectorConfigs(
    data:
      | Record<string, unknown>
      | Record<string, unknown>[]
  ): Promise<unknown>
}

function isMedusaError(error: unknown): error is MedusaError {
  return error instanceof MedusaError
}

function firstRow(rows: unknown): ConnectorConfigRecord | undefined {
  if (!Array.isArray(rows) || rows.length === 0) {
    return undefined
  }
  return rows[0] as ConnectorConfigRecord
}

/**
 * Google Tag Manager connector — persists container ID inside encrypted `credentials_encrypted` for consistency with other connectors.
 */
export class GtmConnector {
  constructor(
    private readonly service: ConnectorConfigServiceApi,
    private readonly encryption: EncryptionService
  ) {}

  /**
   * Returns the configured container ID, or null when not saved yet / undecodable legacy data.
   */
  async get(): Promise<string | null> {
    const rows = await this.service.listConnectorConfigs({
      type: GTM_CONNECTOR_TYPE,
    })
    const row = firstRow(rows)
    if (!row) {
      return null
    }

    try {
      const decrypted = this.encryption.decrypt(row.credentials_encrypted)
      const parsed = parseDecryptedGtmCredentials(decrypted)
      return parsed.container_id
    } catch (error: unknown) {
      if (isMedusaError(error)) {
        return null
      }
      throw error
    }
  }

  async save(containerId: string): Promise<GtmCredentialsPayload> {
    const parsed = gtmContainerIdValueSchema.safeParse(containerId)
    if (!parsed.success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "container_id must match format GTM- followed by letters and digits (e.g. GTM-ABCDEF)"
      )
    }

    const payload: GtmCredentialsPayload = { container_id: parsed.data }
    const encrypted = this.encryption.encrypt(serializeGtmCredentials(payload))

    const rows = await this.service.listConnectorConfigs({
      type: GTM_CONNECTOR_TYPE,
    })
    const existing = firstRow(rows)

    if (!existing) {
      await this.service.createConnectorConfigs({
        type: GTM_CONNECTOR_TYPE,
        credentials_encrypted: encrypted,
        active: true,
        last_tested_at: null,
      })
    } else {
      await this.service.updateConnectorConfigs({
        id: existing.id,
        credentials_encrypted: encrypted,
        active: true,
      })
    }

    return payload
  }
}
