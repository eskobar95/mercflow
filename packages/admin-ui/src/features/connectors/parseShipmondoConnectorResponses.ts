import type {
  ShipmondoCarrierProductDto,
  ShipmondoShippingRulesDto,
} from "./shipmondoTypes"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseCredentialFlags(raw: unknown): {
  apiUserConfigured: boolean
  apiKeyConfigured: boolean
  shippingModuleKeyConfigured: boolean
} {
  if (!isRecord(raw)) {
    return {
      apiUserConfigured: false,
      apiKeyConfigured: false,
      shippingModuleKeyConfigured: false,
    }
  }

  return {
    apiUserConfigured: raw.apiUserConfigured === true,
    apiKeyConfigured: raw.apiKeyConfigured === true,
    shippingModuleKeyConfigured: raw.shippingModuleKeyConfigured === true,
  }
}

function parseLogs(
  raw: unknown
): Array<{ id: string; createdAt: string; message: string; success: boolean }> {
  if (!Array.isArray(raw)) {
    return []
  }

  const out: Array<{
    id: string
    createdAt: string
    message: string
    success: boolean
  }> = []

  for (const item of raw) {
    if (!isRecord(item)) {
      continue
    }
    if (typeof item.id !== "string") {
      continue
    }

    const createdAtRaw = item.createdAt
    const createdAt =
      typeof createdAtRaw === "string" && Number.isFinite(new Date(createdAtRaw).getTime())
        ? createdAtRaw
        : null

    if (createdAt === null) {
      continue
    }

    const message = typeof item.message === "string" ? item.message : "Log entry"

    const success = item.success === true

    out.push({
      id: item.id,
      createdAt,
      message,
      success,
    })
  }

  return out
}

function parseLabelSettingsField(raw: unknown): {
  senderName: string
  senderAddress1: string
  senderPostalCode: string
  senderCity: string
  senderCountryCode: string
  senderEmail: string
  senderPhone: string
  labelFormat: string
  ownAgreement: boolean
} {
  if (!isRecord(raw)) {
    return {
      senderName: "",
      senderAddress1: "",
      senderPostalCode: "",
      senderCity: "",
      senderCountryCode: "DK",
      senderEmail: "",
      senderPhone: "",
      labelFormat: "10x19_pdf",
      ownAgreement: false,
    }
  }

  return {
    senderName: typeof raw.senderName === "string" ? raw.senderName : "",
    senderAddress1: typeof raw.senderAddress1 === "string" ? raw.senderAddress1 : "",
    senderPostalCode: typeof raw.senderPostalCode === "string" ? raw.senderPostalCode : "",
    senderCity: typeof raw.senderCity === "string" ? raw.senderCity : "",
    senderCountryCode:
      typeof raw.senderCountryCode === "string" && raw.senderCountryCode.trim().length === 2
        ? raw.senderCountryCode.trim().toUpperCase()
        : "DK",
    senderEmail: typeof raw.senderEmail === "string" ? raw.senderEmail : "",
    senderPhone: typeof raw.senderPhone === "string" ? raw.senderPhone : "",
    labelFormat:
      typeof raw.labelFormat === "string" && raw.labelFormat.trim() !== ""
        ? raw.labelFormat
        : "10x19_pdf",
    ownAgreement: raw.ownAgreement === true,
  }
}

function parseShippingRulesField(raw: unknown): {
  markupAmountMinor: number
  freeShippingThresholdMinor: number
  enabledCarrierCodes: string[]
} {
  if (!isRecord(raw)) {
    return {
      markupAmountMinor: 0,
      freeShippingThresholdMinor: 0,
      enabledCarrierCodes: [],
    }
  }

  const markup =
    typeof raw.markupAmountMinor === "number" && Number.isFinite(raw.markupAmountMinor)
      ? Math.trunc(raw.markupAmountMinor)
      : NaN

  const threshold =
    typeof raw.freeShippingThresholdMinor === "number" && Number.isFinite(raw.freeShippingThresholdMinor)
      ? Math.trunc(raw.freeShippingThresholdMinor)
      : NaN

  const codesRaw = raw.enabledCarrierCodes
  const codes: string[] = []
  if (Array.isArray(codesRaw)) {
    for (const item of codesRaw) {
      if (typeof item === "string" && item.trim().length > 0) {
        codes.push(item.trim())
      }
    }
  }

  const safeMk = Number.isFinite(markup) && markup >= 0 ? markup : 0
  const safeTh =
    Number.isFinite(threshold) && threshold >= 0 ? threshold : 0

  return {
    markupAmountMinor: safeMk,
    freeShippingThresholdMinor: safeTh,
    enabledCarrierCodes: codes,
  }
}

export function parseShipmondoConnectorGetEnvelope(json: unknown): {
  ok: false
  error: string
} | {
  ok: true
  data: {
    type: "shipmondo"
    active: boolean
    lastTestedAt: string | null
    credentials: {
      apiUserConfigured: boolean
      apiKeyConfigured: boolean
      shippingModuleKeyConfigured: boolean
    }
    recentLogs: Array<{
      id: string
      createdAt: string
      message: string
      success: boolean
    }>
    shippingRules: {
      markupAmountMinor: number
      freeShippingThresholdMinor: number
      enabledCarrierCodes: string[]
    }
    labelSettings: {
      senderName: string
      senderAddress1: string
      senderPostalCode: string
      senderCity: string
      senderCountryCode: string
      senderEmail: string
      senderPhone: string
      labelFormat: string
      ownAgreement: boolean
    }
  }
} {
  if (!isRecord(json)) {
    return { ok: false, error: "Expected JSON object" }
  }

  const data = json.data
  if (!isRecord(data)) {
    return { ok: false, error: "Missing data object" }
  }

  const typeRaw = typeof data.type === "string" ? data.type.toLowerCase() : ""
  if (typeRaw !== "shipmondo") {
    return { ok: false, error: "Unexpected connector payload" }
  }

  const active = data.active === true

  let lastTestedAt: string | null = null
  if (
    typeof data.lastTestedAt === "string" &&
    Number.isFinite(new Date(data.lastTestedAt).getTime())
  ) {
    lastTestedAt = data.lastTestedAt
  } else if (data.lastTestedAt === null) {
    lastTestedAt = null
  }

  const credentials = parseCredentialFlags(data.credentials)
  const recentLogs = parseLogs(data.recentLogs)
  const shippingRules = parseShippingRulesField(data.shippingRules)
  const labelSettings = parseLabelSettingsField(data.labelSettings)

  return {
    ok: true,
    data: {
      type: "shipmondo",
      active,
      lastTestedAt,
      credentials,
      recentLogs,
      shippingRules,
      labelSettings,
    },
  }
}

function parseCarrierProductRow(raw: unknown): ShipmondoCarrierProductDto | null {
  if (!isRecord(raw)) {
    return null
  }

  const productCode = typeof raw.productCode === "string" ? raw.productCode.trim() : ""
  if (productCode === "") {
    return null
  }

  let carrierCode: string | null = null
  if (typeof raw.carrierCode === "string") {
    const cc = raw.carrierCode.trim()
    carrierCode = cc === "" ? null : cc
  } else if (raw.carrierCode === null) {
    carrierCode = null
  }

  const name = typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name.trim() : productCode
  const minor =
    typeof raw.basePriceMinor === "number" && Number.isFinite(raw.basePriceMinor)
      ? Math.trunc(raw.basePriceMinor)
      : Number.NaN
  if (!Number.isFinite(minor) || minor < 0) {
    return null
  }

  return {
    productCode,
    carrierCode,
    name,
    basePriceMinor: minor,
  }
}

export function parseShipmondoCarrierProductsGetEnvelope(json: unknown): {
  ok: false
  error: string
} | {
  ok: true
  data: ShipmondoCarrierProductDto[]
} {
  if (!isRecord(json)) {
    return { ok: false, error: "Expected JSON object" }
  }

  const dataRaw = json.data
  if (!Array.isArray(dataRaw)) {
    return { ok: false, error: "Missing Shipmondo carrier catalogue" }
  }

  const carriers: ShipmondoCarrierProductDto[] = []

  for (const entry of dataRaw) {
    const parsed = parseCarrierProductRow(entry)
    if (parsed !== null) {
      carriers.push(parsed)
    }
  }

  return { ok: true, data: carriers }
}

export function parseShipmondoRulesPatchEnvelope(json: unknown): {
  ok: false
  error: string
} | {
  ok: true
  data: ShipmondoShippingRulesDto
} {
  if (!isRecord(json)) {
    return { ok: false, error: "Expected JSON object" }
  }

  const inner = json.data
  if (!isRecord(inner)) {
    return { ok: false, error: "Missing Shipmondo rules data object" }
  }

  if (
    typeof inner.markupAmountMinor !== "number" ||
    !Number.isFinite(inner.markupAmountMinor) ||
    inner.markupAmountMinor < 0
  ) {
    return { ok: false, error: "Malformed Shipmondo rules response" }
  }

  if (
    typeof inner.freeShippingThresholdMinor !== "number" ||
    !Number.isFinite(inner.freeShippingThresholdMinor) ||
    inner.freeShippingThresholdMinor < 0
  ) {
    return { ok: false, error: "Malformed Shipmondo rules response" }
  }

  if (!Array.isArray(inner.enabledCarrierCodes)) {
    return { ok: false, error: "Malformed Shipmondo rules response" }
  }

  const rules = parseShippingRulesField(inner)
  return { ok: true, data: rules }
}

export function parseShipmondoTestEnvelope(json: unknown): {
  ok: false
  error: string
} | {
  ok: true
  data: { success: boolean; message?: string; error?: string }
} {
  if (!isRecord(json)) {
    return { ok: false, error: "Expected JSON object" }
  }

  if (typeof json.success !== "boolean") {
    return { ok: false, error: "Missing boolean success flag" }
  }

  const success = json.success === true
  const message = typeof json.message === "string" ? json.message : undefined
  const error = typeof json.error === "string" ? json.error : undefined

  return { ok: true, data: { success, message, error } }
}
