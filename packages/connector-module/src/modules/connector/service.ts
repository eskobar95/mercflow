import type { RemoteQueryFunction } from "@medusajs/types"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaService } from "@medusajs/framework/utils"
import StripeSdk from "stripe"

import { ContainerRegistrationKeys, MedusaError } from "@medusajs/utils"

import { PACKAGING_MODULE } from "@mercflow/packaging-module"
import { buildConnectorAdminList } from "./build-connector-admin-list"
import { buildShipmondoShipmentBody } from "./build-shipmondo-shipment-body"
import EncryptionService from "./encryption-service"
import { GtmConnector } from "./gtm-connector"
import type {
  PatchPlunkConnectorBody,
  PostPlunkConnectorTestBody,
  ShipmondoPatchBody,
  ShipmondoPatchShippingRulesBody,
} from "./http-schemas"
import { ConnectorConfig } from "./models/connector-config"
import { ConnectorLog } from "./models/connector-log"
import { pingPlunkWithSecretKey, sendPlunkTestMail } from "./plunk-remote"
import {
  extractShipmondoErrorMessage,
  extractShipmondoLabelBase64FromResponse,
  extractShipmondoTrackingUrl,
  fetchShipmondoProductsJson,
  fetchShipmondoShipmentLabels,
  postShipmondoShipment,
  probeShipmondoShipments,
} from "./shipmondo-http-client"
import { loadShipmondoShipmentContext } from "./load-shipmondo-shipment-context"
import {
  assertShipmondoSenderConfigured,
  mergeShipmondoLabelSettingsPatch,
  type ShipmondoLabelSettingsPatchBody,
} from "./shipmondo-label-settings"
import {
  readShipmondoConnectorRules,
  writeShipmondoConnectorRules,
} from "./shipmondo-connector-rules-json"
import { shipmondoCredentialsSchema, type ShipmondoCredentials } from "./shipmondo-credentials"
import { parseShipmondoCarrierProductsEnvelope } from "./shipmondo-product-catalog"
import {
  normalizeShipmondoRulesFromStoredJson,
  shipmondoPatchShippingRulesBodySchema,
} from "./shipmondo-shipping-rules"
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
  ShipmondoAdminGetDto,
  ShipmondoCarrierProductAdminDto,
  ShipmondoConnectionTestDto,
  ShipmondoCreateLabelResultDto,
  ShipmondoLabelSettingsAdminDto,
  ShipmondoShippingRulesAdminDto,
  StoreShipmondoActiveDto,
  StoreShipmondoRulesDto,
  StripeConnectorAdminDto,
} from "./types"

const SHIPMONDO_TYPE = "shipmondo"
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

const CREDENTIAL_CIPHER_PREFIX = "mf1:"
const CONNECTOR_EVENTS = {
  testPass: "connection_test_pass",
  testFail: "connection_test_fail",
} as const

type ConnectorLogRecord = {
  id: string
  connector_id: string
  event: string
  payload_json: unknown
  created_at: Date | string
}

type ServiceContainerAware = ConnectorModuleService & {
  __container__: MedusaContainer
}

function toIsoStrict(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    return new Date(0).toISOString()
  }
  return d.toISOString()
}

function parseConnectorLogPayload(payload_json: unknown): {
  summary: string
  http_status?: number
  success?: boolean
} {
  if (typeof payload_json !== "object" || payload_json === null) {
    return { summary: "Connector activity recorded" }
  }
  const p = payload_json as Record<string, unknown>
  const summary =
    typeof p.summary === "string" && p.summary.trim().length > 0
      ? p.summary
      : "Connector activity recorded"
  const http_status = typeof p.http_status === "number" ? p.http_status : undefined
  const success = typeof p.success === "boolean" ? p.success : undefined
  return { summary, http_status, success }
}

export default class ConnectorModuleService extends MedusaService({
  ConnectorConfig,
  ConnectorLog,
}) {
  private encryptionLazy: EncryptionService | null = null

  /**
   * Google Tag Manager connector entry point (encrypted credentials + upsert into `connector_config`).
   */
  gtm(): GtmConnector {
    return new GtmConnector(this, this.getEncryption())
  }

  /**
   * Returns all known connector types with configuration and status flags for the admin overview.
   */
  async listConnectorsForAdmin(): Promise<ConnectorAdminListItem[]> {
    const rows = await this.listConnectorConfigs({})
    return buildConnectorAdminList(rows as ConnectorConfigRecord[])
  }

  async getShipmondoStoreActivation(): Promise<StoreShipmondoActiveDto> {
    const row = await this.retrieveShipmondoRow()
    const encrypted = row?.credentials_encrypted?.trim() ?? ""
    const hasCipher =
      encrypted.length > CREDENTIAL_CIPHER_PREFIX.length &&
      encrypted.startsWith(CREDENTIAL_CIPHER_PREFIX)

    const creds = row !== null ? this.safeDecryptCredentials(row) : null
    const configured =
      creds !== null &&
      creds.api_user.trim().length > 0 &&
      creds.api_key.trim().length > 0

    const active = Boolean(hasCipher && configured && Boolean(row?.active))
    return { active }
  }

  async getShipmondoAdminPayload(): Promise<ShipmondoAdminGetDto> {
    const row = await this.retrieveShipmondoRow()
    const creds = row !== null ? this.safeDecryptCredentials(row) : null
    const recentLogs =
      row === null ? [] : await this.listRecentLogsForConnector(row.id)
    return {
      type: "shipmondo",
      active: row !== null ? Boolean(row.active) : false,
      lastTestedAt: row?.last_tested_at
        ? toIsoStrict(row.last_tested_at)
        : null,
      credentials: {
        apiUserConfigured:
          creds !== null ? creds.api_user.trim().length > 0 : false,
        apiKeyConfigured:
          creds !== null ? creds.api_key.trim().length > 0 : false,
        shippingModuleKeyConfigured:
          creds !== null
            ? (creds.shipping_module_key?.trim().length ?? 0) > 0
            : false,
      },
      recentLogs,
      shippingRules: readShipmondoConnectorRules(row === null ? null : row.rules_json).shipping,
      labelSettings: this.toLabelSettingsAdminDto(
        readShipmondoConnectorRules(row === null ? null : row.rules_json).label
      ),
    }
  }

  private toLabelSettingsAdminDto(
    label: ReturnType<typeof readShipmondoConnectorRules>["label"]
  ): ShipmondoLabelSettingsAdminDto {
    return {
      senderName: label.senderName,
      senderAddress1: label.senderAddress1,
      senderPostalCode: label.senderPostalCode,
      senderCity: label.senderCity,
      senderCountryCode: label.senderCountryCode,
      senderEmail: label.senderEmail,
      senderPhone: label.senderPhone,
      labelFormat: label.labelFormat,
      ownAgreement: label.ownAgreement,
    }
  }

  async patchShipmondo(body: ShipmondoPatchBody): Promise<ShipmondoAdminGetDto> {
    const encryption = this.getEncryption()
    const mentionsCredentials =
      body.api_user !== undefined ||
      body.api_key !== undefined ||
      body.shipping_module_key !== undefined

    const rowExisting = await this.retrieveShipmondoRow()

    if (
      rowExisting === null &&
      body.active !== undefined &&
      !mentionsCredentials
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Save Shipmondo API credentials before toggling activation"
      )
    }

    if (rowExisting === null && mentionsCredentials) {
      const api_user = typeof body.api_user === "string" ? body.api_user.trim() : ""
      const api_key = typeof body.api_key === "string" ? body.api_key.trim() : ""
      if (api_user.length === 0 || api_key.length === 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Shipmondo API User and API Key are required for the initial save"
        )
      }

      let shipping_module_key: string | null = null
      if (body.shipping_module_key === null || body.shipping_module_key === "") {
        shipping_module_key = null
      } else if (typeof body.shipping_module_key === "string") {
        shipping_module_key = body.shipping_module_key.trim() || null
      }

      const credsPack: ShipmondoCredentials = {
        api_user,
        api_key,
        ...(shipping_module_key !== null ? { shipping_module_key } : {}),
      }
      shipmondoCredentialsSchema.parse(credsPack)

      const createdRaw = await this.createConnectorConfigs({
        type: SHIPMONDO_TYPE,
        credentials_encrypted: encryption.encrypt(JSON.stringify(credsPack)),
        active: body.active ?? true,
        last_tested_at: null,
      })
      void createdRaw

      return await this.getShipmondoAdminPayload()
    }

    if (rowExisting === null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shipmondo connector is not configured yet — provide credentials first"
      )
    }

    let nextCred = this.requireDecryptedCredentials(rowExisting)

    if (typeof body.api_user === "string") {
      nextCred = { ...nextCred, api_user: body.api_user.trim() }
    }
    if (typeof body.api_key === "string") {
      nextCred = { ...nextCred, api_key: body.api_key.trim() }
    }

    if (body.shipping_module_key !== undefined) {
      if (body.shipping_module_key === "" || body.shipping_module_key === null) {
        const rest: ShipmondoCredentials = {
          api_user: nextCred.api_user,
          api_key: nextCred.api_key,
        }
        nextCred = rest
      } else {
        nextCred = {
          ...nextCred,
          shipping_module_key: body.shipping_module_key.trim(),
        }
      }
    }

    shipmondoCredentialsSchema.parse(nextCred)

    const updatePayload: {
      credentials_encrypted: string
      active?: boolean
      rules_json?: ReturnType<typeof writeShipmondoConnectorRules>
    } = {
      credentials_encrypted: encryption.encrypt(JSON.stringify(nextCred)),
    }

    if (typeof body.active === "boolean") {
      updatePayload.active = body.active
    }

    const labelPatch = this.extractLabelSettingsPatch(body)
    if (labelPatch !== null) {
      const existingRules = readShipmondoConnectorRules(rowExisting.rules_json ?? null)
      const nextLabel = mergeShipmondoLabelSettingsPatch(existingRules.label, labelPatch)
      updatePayload.rules_json = writeShipmondoConnectorRules({
        shipping: existingRules.shipping,
        label: nextLabel,
      })
    }

    await this.updateConnectorConfigs({
      id: rowExisting.id,
      ...updatePayload,
    })

    return await this.getShipmondoAdminPayload()
  }

  private extractLabelSettingsPatch(
    body: ShipmondoPatchBody
  ): ShipmondoLabelSettingsPatchBody | null {
    const patch: ShipmondoLabelSettingsPatchBody = {}
    let touched = false

    if (body.senderName !== undefined) {
      patch.senderName = body.senderName
      touched = true
    }
    if (body.senderAddress1 !== undefined) {
      patch.senderAddress1 = body.senderAddress1
      touched = true
    }
    if (body.senderPostalCode !== undefined) {
      patch.senderPostalCode = body.senderPostalCode
      touched = true
    }
    if (body.senderCity !== undefined) {
      patch.senderCity = body.senderCity
      touched = true
    }
    if (body.senderCountryCode !== undefined) {
      patch.senderCountryCode = body.senderCountryCode
      touched = true
    }
    if (body.senderEmail !== undefined) {
      patch.senderEmail = body.senderEmail
      touched = true
    }
    if (body.senderPhone !== undefined) {
      patch.senderPhone = body.senderPhone
      touched = true
    }
    if (body.labelFormat !== undefined) {
      patch.labelFormat = body.labelFormat
      touched = true
    }
    if (body.ownAgreement !== undefined) {
      patch.ownAgreement = body.ownAgreement
      touched = true
    }

    return touched ? patch : null
  }

  async fetchShipmondoCarrierProducts(opts: {
    countryCode?: string
    fetchImpl?: typeof fetch
  }): Promise<ShipmondoCarrierProductAdminDto[]> {
    const row = await this.retrieveShipmondoRow()
    if (row === null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shipmondo is not configured yet — save credentials before fetching carriers"
      )
    }

    let creds: ShipmondoCredentials
    try {
      creds = this.requireDecryptedCredentials(row)
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stored Shipmondo credentials are unavailable"
      )
    }

    shipmondoCredentialsSchema.parse(creds)

    const res = await fetchShipmondoProductsJson({
      apiUser: creds.api_user,
      apiKey: creds.api_key,
      countryCode: opts.countryCode,
      fetchImpl: opts.fetchImpl,
    })

    if (!res.ok) {
      const message =
        res.httpStatus === 0
          ? "Unable to reach the Shipmondo API"
          : `Shipmondo products endpoint returned HTTP ${res.httpStatus}`
      throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
    }

    return parseShipmondoCarrierProductsEnvelope(res.body).map((entry) => ({
      productCode: entry.productCode,
      carrierCode: entry.carrierCode,
      name: entry.name,
      basePriceMinor: entry.basePriceMinor,
    }))
  }

  async patchShipmondoShippingRules(
    body: ShipmondoPatchShippingRulesBody
  ): Promise<ShipmondoShippingRulesAdminDto> {
    const normalized = shipmondoPatchShippingRulesBodySchema.parse(body)

    const rowExisting = await this.retrieveShipmondoRow()
    if (rowExisting === null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shipmondo connector is not configured yet — save credentials before assigning shipping rules"
      )
    }

    await this.updateConnectorConfigs({
      id: rowExisting.id,
      rules_json: writeShipmondoConnectorRules({
        shipping: normalized,
        label: readShipmondoConnectorRules(rowExisting.rules_json ?? null).label,
      }),
    })

    return normalized
  }

  async createShipmentLabel(input: {
    storeId: string
    fulfillmentId: string
    packagingTypeId: string | null
    fetchImpl?: typeof fetch
  }): Promise<ShipmondoCreateLabelResultDto> {
    const row = await this.retrieveShipmondoRow()
    if (row === null || !row.active) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shipmondo is not configured or inactive — save credentials and enable the connector first"
      )
    }

    let creds: ShipmondoCredentials
    try {
      creds = this.requireDecryptedCredentials(row)
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Stored Shipmondo credentials are unavailable"
      )
    }

    shipmondoCredentialsSchema.parse(creds)

    const connectorRules = readShipmondoConnectorRules(row.rules_json ?? null)
    try {
      assertShipmondoSenderConfigured(connectorRules.label)
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        error instanceof Error ? error.message : "Shipmondo sender settings are incomplete"
      )
    }

    const self = this as unknown as ServiceContainerAware
    const remoteQuery = self.__container__.resolve(
      ContainerRegistrationKeys.QUERY
    ) as unknown as RemoteQueryFunction

    const context = await loadShipmondoShipmentContext({
      graph: remoteQuery.graph,
      fulfillmentId: input.fulfillmentId,
    })

    let packaging: {
      lengthMm: number
      widthMm: number
      heightMm: number
      maxWeightG: number
    } | null = null

    if (input.packagingTypeId !== null && input.packagingTypeId.trim() !== "") {
      const packagingModuleKey = PACKAGING_MODULE
      let packagingService: {
        retrievePackagingType: (
          storeId: string,
          packagingTypeId: string
        ) => Promise<{
          length_mm: number
          width_mm: number
          height_mm: number
          max_weight_g: number
        } | null>
      }
      try {
        packagingService = self.__container__.resolve(packagingModuleKey) as {
          retrievePackagingType: (
            storeId: string,
            packagingTypeId: string
          ) => Promise<{
            length_mm: number
            width_mm: number
            height_mm: number
            max_weight_g: number
          } | null>
        }
      } catch {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          "Packaging module is unavailable — cannot resolve packaging dimensions"
        )
      }

      const packagingType = await packagingService.retrievePackagingType(
        input.storeId,
        input.packagingTypeId.trim()
      )
      if (packagingType === null) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Packaging type ${input.packagingTypeId} was not found`
        )
      }

      packaging = {
        lengthMm: packagingType.length_mm,
        widthMm: packagingType.width_mm,
        heightMm: packagingType.height_mm,
        maxWeightG: packagingType.max_weight_g,
      }
    }

    const senderSettings = connectorRules.label
    const reference =
      context.orderDisplayId !== ""
        ? `Order #${context.orderDisplayId}`
        : `Order ${context.orderId}`

    const shipmentBody = buildShipmondoShipmentBody({
      productCode: context.productCode,
      serviceCodes: "EMAIL_NT,SMS_NT",
      servicePointId: context.servicePointId,
      automaticSelectServicePoint: false,
      labelSettings: senderSettings,
      reference,
      sender: {
        name: senderSettings.senderName,
        address1: senderSettings.senderAddress1,
        postalCode: senderSettings.senderPostalCode,
        city: senderSettings.senderCity,
        countryCode: senderSettings.senderCountryCode,
        email: senderSettings.senderEmail,
        phone: senderSettings.senderPhone,
      },
      receiver: context.receiver,
      packaging,
    })

    const created = await postShipmondoShipment({
      apiUser: creds.api_user,
      apiKey: creds.api_key,
      body: shipmentBody,
      fetchImpl: input.fetchImpl,
    })

    if (!created.ok) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        extractShipmondoErrorMessage(created.body, created.httpStatus)
      )
    }

    const createdBody = created.body
    const shipmentIdRaw =
      typeof createdBody === "object" &&
      createdBody !== null &&
      !Array.isArray(createdBody) &&
      (createdBody as Record<string, unknown>).id

    const shipmentId =
      typeof shipmentIdRaw === "number" || typeof shipmentIdRaw === "string"
        ? shipmentIdRaw
        : null

    if (shipmentId === null) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Shipmondo created a shipment but did not return an id"
      )
    }

    let labelPdfBase64 = extractShipmondoLabelBase64FromResponse(createdBody)
    if (labelPdfBase64 === null) {
      const labels = await fetchShipmondoShipmentLabels({
        apiUser: creds.api_user,
        apiKey: creds.api_key,
        shipmentId,
        fetchImpl: input.fetchImpl,
      })
      if (labels.ok) {
        labelPdfBase64 = extractShipmondoLabelBase64FromResponse(labels.body)
      }
    }

    const trackingUrl = extractShipmondoTrackingUrl(createdBody)

    await this.persistConnectionLog({
      connectorId: row.id,
      success: true,
      summary: `Created Shipmondo shipment ${String(shipmentId)} for fulfillment ${input.fulfillmentId}`,
      http_status: created.httpStatus,
    })

    return {
      shipmentId,
      trackingUrl,
      labelPdfBase64,
      productCode: context.productCode,
      reference,
    }
  }

  async testShipmondoConnection(fetchImpl?: typeof fetch): Promise<ShipmondoConnectionTestDto> {
    const row = await this.retrieveShipmondoRow()
    if (row === null) {
      return { success: false, error: "Shipmondo is not configured yet" }
    }

    let creds: ShipmondoCredentials
    try {
      creds = this.requireDecryptedCredentials(row)
    } catch {
      await this.persistConnectionLog({
        connectorId: row.id,
        success: false,
        summary: "Stored credentials could not be decrypted",
      })
      return { success: false, error: "Stored Shipmondo credentials are unavailable" }
    }

    shipmondoCredentialsSchema.parse(creds)

    const probe = await probeShipmondoShipments({
      apiUser: creds.api_user,
      apiKey: creds.api_key,
      fetchImpl,
    })

    if (probe.ok) {
      await this.updateConnectorConfigs({
        id: row.id,
        last_tested_at: new Date(),
      })

      await this.persistConnectionLog({
        connectorId: row.id,
        success: true,
        summary: `Shipmondo responded with HTTP ${probe.httpStatus}`,
        http_status: probe.httpStatus,
      })

      return {
        success: true,
        message: `Shipmondo connection succeeded (HTTP ${probe.httpStatus})`,
      }
    }

    await this.persistConnectionLog({
      connectorId: row.id,
      success: false,
      summary:
        probe.httpStatus === 0
          ? "Unable to reach Shipmondo"
          : `Shipmondo rejected the probe (HTTP ${probe.httpStatus})`,
      http_status: probe.httpStatus === 0 ? undefined : probe.httpStatus,
    })

    return {
      success: false,
      error:
        probe.httpStatus === 0
          ? "Unable to reach the Shipmondo API"
          : `Shipmondo returned HTTP ${probe.httpStatus}`,
    }
  }

  async getShipmondoStoreShippingRules(): Promise<StoreShipmondoRulesDto> {
    const activation = await this.getShipmondoStoreActivation()
    const row = await this.retrieveShipmondoRow()
    const defaults = normalizeShipmondoRulesFromStoredJson(null)

    if (!activation.active || row === null) {
      return { active: false, ...defaults }
    }

    return {
      active: true,
      ...normalizeShipmondoRulesFromStoredJson(row.rules_json ?? null),
    }
  }

  /**
   * Returns decrypted Shipmondo credentials from `connector_config` when persisted and schema-valid — otherwise null.
   * Caller integrations may fall back to `SHIPMONDO_API_*` env vars via `resolveShipmondoCredentialsWithFallback`.
   */
  async resolveShipmondoCredentialsOrNull(): Promise<ShipmondoCredentials | null> {
    const row = await this.retrieveShipmondoRow()
    if (row === null) {
      return null
    }
    const creds = this.safeDecryptCredentials(row)
    if (creds === null) {
      return null
    }

    try {
      shipmondoCredentialsSchema.parse(creds)
    } catch {
      return null
    }

    if (creds.api_user.trim() === "" || creds.api_key.trim() === "") {
      return null
    }

    return creds
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
      const plain = parseStripePlainCredentialsJson(this.getEncryption().decrypt(row.credentials_encrypted))
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
        plain = parseStripePlainCredentialsJson(this.getEncryption().decrypt(row.credentials_encrypted))
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

    const encPayload = this.getEncryption().encrypt(JSON.stringify(nextPlain))

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

  private getEncryption(): EncryptionService {
    this.encryptionLazy ??= new EncryptionService()
    return this.encryptionLazy
  }

  private async retrieveShipmondoRow(): Promise<ConnectorConfigRecord | null> {
    const rows = await this.listConnectorConfigs({ type: SHIPMONDO_TYPE })
    const hit = rows[0] as ConnectorConfigRecord | undefined
    return hit ?? null
  }

  private safeDecryptCredentials(
    row: ConnectorConfigRecord
  ): ShipmondoCredentials | null {
    try {
      return this.decryptCredentialPayload(row.credentials_encrypted)
    } catch {
      return null
    }
  }

  private requireDecryptedCredentials(row: ConnectorConfigRecord): ShipmondoCredentials {
    return this.decryptCredentialPayload(row.credentials_encrypted)
  }

  private decryptCredentialPayload(encoded: string): ShipmondoCredentials {
    const encryption = this.getEncryption()
    const raw = encryption.decrypt(encoded.trim())
    const parsed: unknown = JSON.parse(raw)
    return shipmondoCredentialsSchema.parse(parsed)
  }

  private async persistConnectionLog(input: {
    connectorId: string
    success: boolean
    summary: string
    http_status?: number
  }): Promise<void> {
    await this.createConnectorLogs({
      connector_id: input.connectorId,
      event: input.success ? CONNECTOR_EVENTS.testPass : CONNECTOR_EVENTS.testFail,
      payload_json: {
        success: input.success,
        summary: input.summary.slice(0, 500),
        ...(input.http_status !== undefined ? { http_status: input.http_status } : {}),
      },
    })
  }

  private async listRecentLogsForConnector(
    connectorId: string
  ): Promise<
    Array<{
      id: string
      createdAt: string
      message: string
      success: boolean
    }>
  > {
    type ListSvc = (
      filters: { connector_id: string },
      config?: { take: number }
    ) => Promise<ConnectorLogRecord[]>

    const rows = await (
      this as unknown as {
        listConnectorLogs: ListSvc
      }
    ).listConnectorLogs({ connector_id: connectorId }, { take: 50 })

    const sorted = [...rows].sort((a, b) => {
      const tb = new Date(toIsoStrict(b.created_at)).getTime()
      const ta = new Date(toIsoStrict(a.created_at)).getTime()
      return tb - ta
    })

    return sorted.slice(0, 5).map((log) => {
      const parsed = parseConnectorLogPayload(log.payload_json)
      const inferredSuccess =
        typeof parsed.success === "boolean"
          ? parsed.success
          : log.event === CONNECTOR_EVENTS.testPass

      return {
        id: log.id,
        createdAt: toIsoStrict(log.created_at),
        message: parsed.summary.slice(0, 400),
        success: inferredSuccess,
      }
    })
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
