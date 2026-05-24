import type { RemoteQueryFunction } from "@medusajs/types"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"
import StripeSdk from "stripe"

import { ContainerRegistrationKeys, MedusaError } from "@medusajs/utils"

import { buildConnectorAdminList } from "./build-connector-admin-list"
import EncryptionService from "./encryption-service"
import { ConnectorConfig } from "./models/connector-config"
import { ConnectorLog } from "./models/connector-log"
import { maskStripeField } from "./stripe/stripe-mask"
import type { StripePaymentOverviewRow } from "./stripe/stripe-payments-list"
import { stripeListRecentPaymentIntents } from "./stripe/stripe-payments-list"
import { syncMercflowCatalogToStripe } from "./stripe/stripe-sync-all-products"
import { stripeTestConnection } from "./stripe/stripe-test-connection"
import type { StripeConnectorPatchBody } from "./stripe-http-schemas"
import { lastFour, mergeStripePlainCredentials, parseStripePlainCredentialsJson } from "./stripe/stripe-plain-credentials"
import type { StripePlainCredentials } from "./stripe/stripe-plain-credentials"
import type {
  ConnectorAdminListItem,
  ConnectorConfigRecord,
  StripeConnectorAdminDto,
} from "./types"

const STRIPE_TYPE = "stripe"

type ServiceContainerAware = ConnectorModuleService & {
  __container__: MedusaContainer
}

export default class ConnectorModuleService extends MedusaService({
  ConnectorConfig,
  ConnectorLog,
}) {
  private encryption(): EncryptionService {
    return new EncryptionService()
  }

  /**
   * Returns all known connector types with configuration and status flags for the admin overview.
   */
  async listConnectorsForAdmin(): Promise<ConnectorAdminListItem[]> {
    const rows = await this.listConnectorConfigs({})
    return buildConnectorAdminList(rows as ConnectorConfigRecord[])
  }

  /**
   * Public VAT mode for storefront checkout — never exposes credentials.
   */
  async getStripeVatModeForStorefront(): Promise<"inclusive" | "exclusive"> {
    const row = await this.findStripeConfigRow()
    if (!row) {
      return "inclusive"
    }
    const vat = row.vat_mode.trim().toLowerCase()
    return vat === "exclusive" ? "exclusive" : "inclusive"
  }

  /**
   * Resolves the Stripe secret key for Medusa payment providers: env first, then decrypted connector row.
   */
  async resolveStripeSecretKeyOrNull(): Promise<string | null> {
    const envFromApi = process.env.STRIPE_API_KEY
    const envFromSecret = process.env.STRIPE_SECRET_KEY
    const a = envFromApi !== undefined && envFromApi.trim() !== "" ? envFromApi.trim() : null
    const b =
      envFromSecret !== undefined && envFromSecret.trim() !== ""
        ? envFromSecret.trim()
        : null
    const envNormalized = a ?? b

    if (envNormalized !== null && envNormalized !== "") {
      return envNormalized
    }

    const row = await this.findStripeConfigRow()
    if (!row) {
      return null
    }

    try {
      const plain = parseStripePlainCredentialsJson(this.encryption().decrypt(row.credentials_encrypted))
      const sk = plain.secret_key.trim()
      return sk !== "" ? sk : null
    } catch {
      return null
    }
  }

  async getStripeAdminDetail(): Promise<StripeConnectorAdminDto> {
    const row = await this.findStripeConfigRow()
    if (!row) {
      return {
        configured: false,
        active: false,
        vat_mode: "inclusive",
        secret_key_masked: null,
        publishable_key_masked: null,
        webhook_secret_masked: null,
        last_tested_at: null,
      }
    }

    const vat = row.vat_mode.trim().toLowerCase() === "exclusive" ? "exclusive" : "inclusive"

    return {
      configured: true,
      active: Boolean(row.active),
      vat_mode: vat,
      secret_key_masked: maskStripeField("Secret key", row.secret_key_last4),
      publishable_key_masked: maskStripeField("Publishable key", row.publishable_key_last4),
      webhook_secret_masked: maskStripeField("Webhook secret", row.webhook_secret_last4),
      last_tested_at:
        row.last_tested_at === null ? null : new Date(row.last_tested_at).toISOString(),
    }
  }

  async patchStripeConnector(body: StripeConnectorPatchBody): Promise<StripeConnectorAdminDto> {
    let row = await this.findStripeConfigRow()

    const emptyPlain: StripePlainCredentials = {
      secret_key: "",
      publishable_key: "",
      webhook_secret: "",
    }

    let plain = emptyPlain
    if (row) {
      try {
        plain = parseStripePlainCredentialsJson(this.encryption().decrypt(row.credentials_encrypted))
      } catch {
        plain = emptyPlain
      }
    }

    const nextPlain = mergeStripePlainCredentials(plain, {
      secret_key: body.secret_key,
      publishable_key: body.publishable_key,
      webhook_secret: body.webhook_secret,
    })

    const nextVat =
      body.vat_mode ??
      (row?.vat_mode?.trim().toLowerCase() === "exclusive" ? "exclusive" : "inclusive")

    const nextActive = body.active !== undefined ? Boolean(body.active) : Boolean(row?.active ?? true)

    if (nextPlain.secret_key === "" || nextPlain.publishable_key === "") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stripe requires both secret_key and publishable_key once you save connector credentials."
      )
    }

    const encPayload = this.encryption().encrypt(JSON.stringify(nextPlain))

    const previews = {
      secret_key_last4: lastFour(nextPlain.secret_key),
      publishable_key_last4: lastFour(nextPlain.publishable_key),
      webhook_secret_last4: lastFour(nextPlain.webhook_secret),
    }

    if (!row) {
      const created = await this.createConnectorConfigs({
        type: STRIPE_TYPE,
        credentials_encrypted: encPayload,
        active: nextActive,
        last_tested_at: null,
        vat_mode: nextVat,
        secret_key_last4: previews.secret_key_last4,
        publishable_key_last4: previews.publishable_key_last4,
        webhook_secret_last4: previews.webhook_secret_last4,
      })
      const createdRow = Array.isArray(created) ? created[0] : created
      if (!createdRow) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Stripe connector row was not created"
        )
      }
      row = createdRow

      await this.createConnectorLogs({
        connector_id: createdRow.id,
        event: "stripe.credentials_saved",
        payload_json: { source: "admin_patch" },
      })
    } else {
      await this.updateConnectorConfigs({
        id: row.id,
        credentials_encrypted: encPayload,
        active: nextActive,
        vat_mode: nextVat,
        secret_key_last4: previews.secret_key_last4,
        publishable_key_last4: previews.publishable_key_last4,
        webhook_secret_last4: previews.webhook_secret_last4,
      })

      const updated = await this.retrieveConnectorConfig(row.id)

      await this.createConnectorLogs({
        connector_id: updated.id,
        event: "stripe.credentials_updated",
        payload_json: { source: "admin_patch" },
      })
    }

    return this.getStripeAdminDetail()
  }

  async stripeConnectionTestAdmin(): Promise<{ ok: true }> {
    const secret = await this.resolveStripeSecretKeyOrNull()
    if (!secret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stripe is not configured: set Stripe connector credentials or STRIPE_API_KEY"
      )
    }

    await stripeTestConnection(secret)

    const row = await this.findStripeConfigRow()
    const now = new Date()
    if (row) {
      await this.updateConnectorConfigs({
        id: row.id,
        last_tested_at: now,
      })
    }

    return { ok: true }
  }

  async stripeSyncAllProductsAdmin(): Promise<{
    success: true
    result: Awaited<ReturnType<typeof syncMercflowCatalogToStripe>>
  }> {
    const secret = await this.resolveStripeSecretKeyOrNull()
    if (!secret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stripe is not configured: set Stripe connector credentials or STRIPE_API_KEY"
      )
    }

    const row = await this.findStripeConfigRow()

    const self = this as unknown as ServiceContainerAware
    const remoteQuery = self.__container__.resolve(
      ContainerRegistrationKeys.QUERY
    ) as unknown as RemoteQueryFunction

    if (row) {
      await this.createConnectorLogs({
        connector_id: row.id,
        event: "stripe.sync_products.start",
        payload_json: {},
      })
    }

    try {
      const stripe = new StripeSdk(secret)
      const vatMode =
        row?.vat_mode?.trim().toLowerCase() === "exclusive" ? "exclusive" : "inclusive"
      const result = await syncMercflowCatalogToStripe(
        stripe,
        { graph: remoteQuery.graph },
        { priceTaxBehavior: vatMode }
      )

      if (row) {
        await this.createConnectorLogs({
          connector_id: row.id,
          event: "stripe.sync_products.complete",
          payload_json: result as unknown as Record<string, unknown>,
        })
      }

      return { success: true, result }
    } catch (e) {
      if (row) {
        await this.createConnectorLogs({
          connector_id: row.id,
          event: "stripe.sync_products.error",
          payload_json: {
            message: e instanceof Error ? e.message : "unknown_error",
          },
        })
      }
      throw e
    }
  }

  async stripeListPaymentsAdmin(limit: number): Promise<StripePaymentOverviewRow[]> {
    const secret = await this.resolveStripeSecretKeyOrNull()
    if (!secret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stripe is not configured: set Stripe connector credentials or STRIPE_API_KEY"
      )
    }

    const stripe = new StripeSdk(secret)
    return stripeListRecentPaymentIntents(stripe, limit)
  }

  async setStripeVatMode(mode: "inclusive" | "exclusive"): Promise<StripeConnectorAdminDto> {
    const row = await this.findStripeConfigRow()
    if (!row) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Stripe connector is not configured — save credentials before changing VAT mode"
      )
    }

    await this.updateConnectorConfigs({
      id: row.id,
      vat_mode: mode,
    })

    await this.createConnectorLogs({
      connector_id: row.id,
      event: "stripe.vat_mode_changed",
      payload_json: { vat_mode: mode },
    })

    return this.getStripeAdminDetail()
  }

  private async findStripeConfigRow(): Promise<ConnectorConfigRecord | null> {
    const rows = await this.listConnectorConfigs({})
    const found = rows.find((r: { type: string }) => r.type.trim().toLowerCase() === STRIPE_TYPE)
    return found !== undefined ? (found as ConnectorConfigRecord) : null
  }
}
