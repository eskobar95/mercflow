import { z } from "zod"

export const SHIPMONDO_LABEL_FORMATS = [
  "10x19_pdf",
  "a4_pdf",
  "10x19_zpl",
  "compact_pdf",
  "compact_zpl",
] as const

export type ShipmondoLabelFormat = (typeof SHIPMONDO_LABEL_FORMATS)[number]

export type ShipmondoSenderSettings = {
  senderName: string
  senderAddress1: string
  senderPostalCode: string
  senderCity: string
  senderCountryCode: string
  senderEmail: string
  senderPhone: string
}

export type ShipmondoLabelSettings = ShipmondoSenderSettings & {
  labelFormat: ShipmondoLabelFormat
  ownAgreement: boolean
}

export type ShipmondoLabelSettingsStored = {
  sender_name: string
  sender_address1: string
  sender_postal_code: string
  sender_city: string
  sender_country_code: string
  sender_email: string
  sender_phone: string
  label_format: ShipmondoLabelFormat
  own_agreement: boolean
}

const countryCodeSchema = z
  .string()
  .trim()
  .length(2)
  .transform((value) => value.toUpperCase())

const emailSchema = z.string().trim().email().max(320)

const phoneSchema = z.string().trim().min(3).max(40)

/** PATCH /admin/connectors/shipmondo — optional sender + label settings (merged into rules_json). */
export const shipmondoLabelSettingsPatchSchema = z
  .object({
    senderName: z.string().trim().min(1).max(200).optional(),
    senderAddress1: z.string().trim().min(1).max(200).optional(),
    senderPostalCode: z.string().trim().min(1).max(20).optional(),
    senderCity: z.string().trim().min(1).max(120).optional(),
    senderCountryCode: countryCodeSchema.optional(),
    senderEmail: emailSchema.optional(),
    senderPhone: phoneSchema.optional(),
    labelFormat: z.enum(SHIPMONDO_LABEL_FORMATS).optional(),
    ownAgreement: z.boolean().optional(),
  })
  .strict()

export type ShipmondoLabelSettingsPatchBody = z.infer<typeof shipmondoLabelSettingsPatchSchema>

export function defaultShipmondoLabelSettings(): ShipmondoLabelSettings {
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

function readTrimmedString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key]
  return typeof value === "string" ? value.trim() : ""
}

function readLabelFormat(raw: Record<string, unknown>): ShipmondoLabelFormat {
  const value = readTrimmedString(raw, "label_format")
  if ((SHIPMONDO_LABEL_FORMATS as readonly string[]).includes(value)) {
    return value as ShipmondoLabelFormat
  }
  return "10x19_pdf"
}

export function normalizeShipmondoLabelSettingsFromStoredJson(
  raw: unknown | null | undefined
): ShipmondoLabelSettings {
  const defaults = defaultShipmondoLabelSettings()
  if (typeof raw !== "object" || raw === null) {
    return defaults
  }

  const record = raw as Record<string, unknown>
  const country = readTrimmedString(record, "sender_country_code").toUpperCase()

  return {
    senderName: readTrimmedString(record, "sender_name"),
    senderAddress1: readTrimmedString(record, "sender_address1"),
    senderPostalCode: readTrimmedString(record, "sender_postal_code"),
    senderCity: readTrimmedString(record, "sender_city"),
    senderCountryCode: country.length === 2 ? country : defaults.senderCountryCode,
    senderEmail: readTrimmedString(record, "sender_email"),
    senderPhone: readTrimmedString(record, "sender_phone"),
    labelFormat: readLabelFormat(record),
    ownAgreement: record.own_agreement === true,
  }
}

export function shipmondoLabelSettingsToStored(
  settings: ShipmondoLabelSettings
): ShipmondoLabelSettingsStored {
  return {
    sender_name: settings.senderName.trim(),
    sender_address1: settings.senderAddress1.trim(),
    sender_postal_code: settings.senderPostalCode.trim(),
    sender_city: settings.senderCity.trim(),
    sender_country_code: settings.senderCountryCode.trim().toUpperCase(),
    sender_email: settings.senderEmail.trim(),
    sender_phone: settings.senderPhone.trim(),
    label_format: settings.labelFormat,
    own_agreement: settings.ownAgreement,
  }
}

export function mergeShipmondoLabelSettingsPatch(
  current: ShipmondoLabelSettings,
  patch: ShipmondoLabelSettingsPatchBody
): ShipmondoLabelSettings {
  return {
    senderName: patch.senderName ?? current.senderName,
    senderAddress1: patch.senderAddress1 ?? current.senderAddress1,
    senderPostalCode: patch.senderPostalCode ?? current.senderPostalCode,
    senderCity: patch.senderCity ?? current.senderCity,
    senderCountryCode: patch.senderCountryCode ?? current.senderCountryCode,
    senderEmail: patch.senderEmail ?? current.senderEmail,
    senderPhone: patch.senderPhone ?? current.senderPhone,
    labelFormat: patch.labelFormat ?? current.labelFormat,
    ownAgreement: patch.ownAgreement ?? current.ownAgreement,
  }
}

export function assertShipmondoSenderConfigured(settings: ShipmondoLabelSettings): void {
  const missing: string[] = []
  if (settings.senderName.trim() === "") {
    missing.push("sender name")
  }
  if (settings.senderAddress1.trim() === "") {
    missing.push("sender address")
  }
  if (settings.senderPostalCode.trim() === "") {
    missing.push("sender postal code")
  }
  if (settings.senderCity.trim() === "") {
    missing.push("sender city")
  }
  if (settings.senderCountryCode.trim().length !== 2) {
    missing.push("sender country code")
  }
  if (settings.senderEmail.trim() === "") {
    missing.push("sender email")
  }
  if (settings.senderPhone.trim() === "") {
    missing.push("sender phone")
  }

  if (missing.length > 0) {
    throw new Error(
      `Shipmondo sender settings are incomplete — configure ${missing.join(", ")} in Settings → Connectors → Shipmondo`
    )
  }
}
