import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import { readStoreGeneralMetadata, writeStoreGeneralMetadata } from "./storeMetadata"
import type {
  AdminCurrencyDto,
  AdminStoreDto,
  GeneralSettingsFormValues,
  UpdateStoreInput,
} from "./types"

function adminBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000).",
    )
  }
  return base
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseStoreCurrency(value: unknown): AdminStoreDto["supportedCurrencies"][number] | null {
  if (!isRecord(value)) return null
  const currencyCodeRaw = value.currency_code
  if (typeof currencyCodeRaw !== "string" || currencyCodeRaw.trim() === "") return null
  return {
    currencyCode: currencyCodeRaw.trim().toLowerCase(),
    isDefault: value.is_default === true,
  }
}

function parseStore(value: unknown): AdminStoreDto | null {
  if (!isRecord(value)) return null
  const id = typeof value.id === "string" ? value.id : null
  const name = typeof value.name === "string" ? value.name : null
  if (id === null || name === null) return null
  const supportedRaw = value.supported_currencies
  const supportedCurrencies = Array.isArray(supportedRaw)
    ? supportedRaw
        .map(parseStoreCurrency)
        .filter((entry): entry is AdminStoreDto["supportedCurrencies"][number] => entry !== null)
    : []
  const metadataRaw = value.metadata
  const metadata =
    metadataRaw === null || metadataRaw === undefined
      ? null
      : isRecord(metadataRaw)
        ? metadataRaw
        : null
  return { id, name, supportedCurrencies, metadata }
}

function parseCurrency(value: unknown): AdminCurrencyDto | null {
  if (!isRecord(value)) return null
  const code = typeof value.code === "string" ? value.code.trim().toLowerCase() : null
  const name = typeof value.name === "string" ? value.name : null
  if (code === null || code === "" || name === null) return null
  return { code, name }
}

export function resolveDefaultCurrencyCode(store: AdminStoreDto): string {
  const fromDefault = store.supportedCurrencies.find((entry) => entry.isDefault)?.currencyCode
  if (typeof fromDefault === "string" && fromDefault !== "") return fromDefault
  const first = store.supportedCurrencies[0]?.currencyCode
  return typeof first === "string" ? first : "dkk"
}

export function storeToGeneralFormValues(store: AdminStoreDto): GeneralSettingsFormValues {
  const general = readStoreGeneralMetadata(store.metadata)
  return {
    storeName: store.name,
    contactEmail: general.contactEmail,
    defaultCurrency: resolveDefaultCurrencyCode(store),
    timezone: general.timezone,
    address: general.address,
  }
}

export function buildStoreUpdatePayload(
  store: AdminStoreDto,
  values: GeneralSettingsFormValues,
): UpdateStoreInput {
  const nextDefault = values.defaultCurrency.trim().toLowerCase()
  const currencyCodes = new Set(store.supportedCurrencies.map((entry) => entry.currencyCode))
  currencyCodes.add(nextDefault)
  const supportedCurrencies = [...currencyCodes].map((currencyCode) => ({
    currency_code: currencyCode,
    is_default: currencyCode === nextDefault,
  }))
  const metadata = writeStoreGeneralMetadata(store.metadata, {
    contactEmail: values.contactEmail,
    timezone: values.timezone,
    address: values.address,
  })
  return { name: values.storeName.trim(), supportedCurrencies, metadata }
}

export async function fetchPrimaryStore(): Promise<AdminStoreDto> {
  const params = new URLSearchParams({ limit: "1", offset: "0" })
  const response = await fetch(`${adminBase()}/admin/stores?${params.toString()}`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
  const payload = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(payload)) throw new Error("Unexpected store list response.")
  const stores = payload.stores
  if (!Array.isArray(stores) || stores.length === 0) throw new Error("No store found for this tenant.")
  const store = parseStore(stores[0])
  if (store === null) throw new Error("Unexpected store payload.")
  return store
}

export async function listAdminCurrencies(): Promise<AdminCurrencyDto[]> {
  const params = new URLSearchParams({ limit: "100", offset: "0" })
  const response = await fetch(`${adminBase()}/admin/currencies?${params.toString()}`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
  const payload = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(payload)) throw new Error("Unexpected currencies response.")
  const currencies = payload.currencies
  if (!Array.isArray(currencies)) return []
  return currencies
    .map(parseCurrency)
    .filter((entry): entry is AdminCurrencyDto => entry !== null)
    .toSorted((left, right) => left.code.localeCompare(right.code))
}

export async function updateAdminStore(storeId: string, input: UpdateStoreInput): Promise<AdminStoreDto> {
  const response = await fetch(`${adminBase()}/admin/stores/${encodeURIComponent(storeId)}`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({
      name: input.name,
      supported_currencies: input.supportedCurrencies,
      metadata: input.metadata,
    }),
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
  const payload = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(payload)) throw new Error("Unexpected store update response.")
  const store = parseStore(payload.store)
  if (store === null) throw new Error("Unexpected store payload.")
  return store
}
