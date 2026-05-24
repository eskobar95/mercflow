import type { RemoteQueryFunction } from "@medusajs/types"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"
import StripeSdk from "stripe"

import { ContainerRegistrationKeys, MedusaError } from "@medusajs/utils"

import { buildConnectorAdminList } from "./build-connector-admin-list"
import EncryptionService from "./encryption-service"
import { ConnectorConfig } from "./models/connector-config"
import { ConnectorLog } from "./models/connector-log"
import type { PatchPlunkConnectorBody, PostPlunkConnectorTestBody } from "./http-schemas"
import { pingPlunkWithSecretKey, sendPlunkTestMail } from "./plunk-remote"
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
  ConnectorConnectionHealth,
  ConnectorConfigRecord,
  PlunkAdminConnectorState,
  PlunkConnectionTestResult,
  PlunkCredentialsStored,
  StripeConnectorAdminDto,
} from "./types"

const STRIPE_TYPE = "stripe"
const PLUNK_TYPE = "plunk"

function assertRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function maskApiKey(apiKey: string): string {
  const t = apiKey.trim()
  if (t.length <= 12) {
    return "••••••••"
  }
  return `${t.slice(0, 7)}…${t.slice(-4)}`
}

function parsePlunkPayloadJson(parsed: unknown): PlunkCredentialsStored | null {
  if (!assertRecord(parsed)) {
    return null
  }
  const key = parsed["api_key"]
  const fromEmail = parsed["from_email"]
  const fromName = parsed["from_name"]
  if (typeof key !== "string" || key.trim() === "") {
    return null
  }
  if (!(fromEmail === null || typeof fromEmail === "string")) {
    return null
  }
  if (!(fromName === null || typeof fromName === "string")) {
    return null
  }
  const emailTrimmed =
    typeof fromEmail === "string" && fromEmail.trim() !== "" ? fromEmail.trim() : null
  const nameTrimmed =
    typeof fromName === "string" && fromName.trim() !== "" ? fromName.trim() : null
  return {
    api_key: key.trim(),
    from_email: emailTrimmed,
    from_name: nameTrimmed,
  }
}

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

  /**
   * Plunk-specific admin read model (masked key, decrypted non-secret fields).
   */
  async getPlunkConnectorForAdmin(): Promise<PlunkAdminConnectorState> {
    const row = await this.retrievePlunkConfigRow()
    if (!row) {
      return this.buildPlunkAdminStateUncreated()
    }
    const payload = await this.safeDecryptPlunkPayload(row.credentials_encrypted)
    if (!payload) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stored Plunk credentials have an unexpected shape or could not be decrypted"
      )
    }
    return this.composePlunkAdminState(row, payload)
  }

  /**
   * Create or merge Plunk credentials and sender defaults.
   */
  async upsertPlunkCredentials(patch: PatchPlunkConnectorBody): Promise<PlunkAdminConnectorState> {
    const encryption = new EncryptionService()
    const existing = await this.retrievePlunkConfigRow()

    if (!existing && patch.api_key === undefined) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "api_key is required when configuring Plunk for the first time"
      )
    }

    let merged: PlunkCredentialsStored
    let nextActive: boolean

    if (!existing) {
      merged = {
        api_key: patch.api_key!,
        from_email: patch.from_email !== undefined ? patch.from_email ?? null : null,
        from_name: patch.from_name !== undefined ? patch.from_name ?? null : null,
      }
      nextActive = patch.active !== undefined ? patch.active : true

      const createdUnknown = await this.createConnectorConfigs({
        type: PLUNK_TYPE,
        credentials_encrypted: encryption.encrypt(JSON.stringify(merged)),
        active: nextActive,
        connection_status: null,
        last_test_message: null,
      })

      const created = Array.isArray(createdUnknown) ? createdUnknown[0] : createdUnknown

      await this.appendConnectorLog(
        created.id as string,
        "plunk.credentials_created",
        { fromConfigured: merged.from_email !== null }
      )
      return this.composePlunkAdminState(created as ConnectorConfigRecord, merged)
    }

    const rawPlain = encryption.decrypt(existing.credentials_encrypted)
    const decodedUnknown = JSON.parse(rawPlain) as unknown
    const current = parsePlunkPayloadJson(decodedUnknown)
    if (!current) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Existing Plunk credentials could not be read — re-enter your API key"
      )
    }

    merged = {
      api_key: patch.api_key !== undefined ? patch.api_key : current.api_key,
      from_email:
        patch.from_email !== undefined ? patch.from_email ?? null : current.from_email,
      from_name: patch.from_name !== undefined ? patch.from_name ?? null : current.from_name,
    }

    nextActive = patch.active !== undefined ? patch.active : existing.active

    const updatedUnknown = await this.updateConnectorConfigs({
      id: existing.id,
      credentials_encrypted: encryption.encrypt(JSON.stringify(merged)),
      active: nextActive,
    })
    const updated = Array.isArray(updatedUnknown) ? updatedUnknown[0] : updatedUnknown

    await this.appendConnectorLog(existing.id, "plunk.credentials_updated", {})

    return this.composePlunkAdminState(updated as ConnectorConfigRecord, merged)
  }

  /**
   * Calls Plunk with stored credentials (`/v1/track` by default; `/v1/send` when `test_email` is set).
   */
  async runPlunkConnectionTest(
    body: PostPlunkConnectorTestBody
  ): Promise<PlunkConnectionTestResult> {
    const row = await this.retrievePlunkConfigRow()
    if (!row) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Save Plunk credentials before running a connection test"
      )
    }

    let payload: PlunkCredentialsStored | null
    try {
      payload = await this.safeDecryptPlunkPayload(row.credentials_encrypted)
    } catch {
      payload = null
    }

    if (!payload) {
      return await this.recordPlunkProbeFailure(row, new Error(
        "Could not decrypt stored credentials — verify MERCFLOW_CONNECTOR_ENCRYPTION_KEY"
      ))
    }

    const trimmedTestEmail = body.test_email?.trim()
    const probe =
      trimmedTestEmail && trimmedTestEmail !== ""
        ? await sendPlunkTestMail({
            apiKey: payload.api_key,
            to: trimmedTestEmail,
            fromEmail: payload.from_email,
            fromName: payload.from_name,
          })
        : await pingPlunkWithSecretKey(payload.api_key)

    const now = new Date()
    const message =
      probe.ok === true ? "Successfully reached the Plunk API." : probe.message.slice(0, 2000)

    await this.updateConnectorConfigs({
      id: row.id,
      last_tested_at: now,
      connection_status: probe.ok === true ? "ok" : "error",
      last_test_message: message,
    })

    await this.appendConnectorLog(row.id, probe.ok === true ? "plunk.probe.ok" : "plunk.probe.error", {
      mode: trimmedTestEmail ? "send" : "track",
      used_test_recipient: Boolean(trimmedTestEmail),
    })

    return probe.ok === true ? { success: true, message } : { success: false, message }
  }

  /**
   * Returns decrypted Plunk `api_key` from `connector_config` when configured — otherwise null.
   * Downstream callers may still consult `process.env.PLUNK_SECRET_KEY`.
   */
  async resolvePlunkApiKey(): Promise<string | null> {
    const row = await this.retrievePlunkConfigRow()
    if (!row) {
      return null
    }

    try {
      const payload = await this.safeDecryptPlunkPayload(row.credentials_encrypted)
      if (!payload?.api_key) {
        return null
      }
      return payload.api_key.trim() !== "" ? payload.api_key.trim() : null
    } catch {
      return null
    }
  }

  private async findStripeConfigRow(): Promise<ConnectorConfigRecord | null> {
    const rows = await this.listConnectorConfigs({})
    const found = rows.find((r: { type: string }) => r.type.trim().toLowerCase() === STRIPE_TYPE)
    return found !== undefined ? (found as ConnectorConfigRecord) : null
  }

  private composePlunkAdminState(
    row: ConnectorConfigRecord,
    credentials: PlunkCredentialsStored
  ): PlunkAdminConnectorState {
    return {
      type: PLUNK_TYPE,
      configured: true,
      active: Boolean(row.active),
      apiKeyMasked: maskApiKey(credentials.api_key),
      fromEmail: credentials.from_email,
      fromName: credentials.from_name,
      connectionHealth: this.connectionHealthFromRow(row),
      lastTestedAt: row.last_tested_at ? new Date(row.last_tested_at).toISOString() : null,
      lastTestMessage: row.last_test_message,
    }
  }

  private buildPlunkAdminStateUncreated(): PlunkAdminConnectorState {
    return {
      type: PLUNK_TYPE,
      configured: false,
      active: false,
      apiKeyMasked: null,
      fromEmail: null,
      fromName: null,
      connectionHealth: null,
      lastTestedAt: null,
      lastTestMessage: null,
    }
  }

  private connectionHealthFromRow(row: ConnectorConfigRecord): ConnectorConnectionHealth {
    const s = (row.connection_status ?? "").trim().toLowerCase()
    if (s === "ok") {
      return "ok"
    }
    if (s === "error") {
      return "error"
    }
    return "untested"
  }

  private async retrievePlunkConfigRow(): Promise<ConnectorConfigRecord | null> {
    const rows = await this.listConnectorConfigs({ type: PLUNK_TYPE }, { take: 1 })
    const hit = rows[0]
    return hit !== undefined ? (hit as ConnectorConfigRecord) : null
  }

  private async safeDecryptPlunkPayload(blob: string): Promise<PlunkCredentialsStored | null> {
    const encryption = new EncryptionService()
    const plain = encryption.decrypt(blob)
    const parsedUnknown = JSON.parse(plain) as unknown
    return parsePlunkPayloadJson(parsedUnknown)
  }

  private async appendConnectorLog(
    connector_id: string,
    event: string,
    payload_json: Record<string, unknown>
  ): Promise<void> {
    await this.createConnectorLogs({
      connector_id,
      event,
      payload_json,
    })
  }

  private async recordPlunkProbeFailure(
    row: ConnectorConfigRecord,
    cause: unknown
  ): Promise<PlunkConnectionTestResult> {
    const fallback =
      cause instanceof Error ? cause.message : "Connection test failed for an unexpected reason."
    const message = fallback.slice(0, 2000)
    const now = new Date()
    await this.updateConnectorConfigs({
      id: row.id,
      last_tested_at: now,
      connection_status: "error",
      last_test_message: message,
    })
    await this.appendConnectorLog(row.id, "plunk.probe.error", { reason: message })
    return { success: false, message }
  }
}
