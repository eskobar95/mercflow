import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { CreateTaxRegionInput, TaxRegionRow, UpdateTaxRegionInput } from "./types"

const SYSTEM_TAX_PROVIDER_ID = "tp_system"

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

function slugifyTaxCode(name: string): string {
  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
  return normalized === "" ? "default" : normalized.slice(0, 32)
}

function parseTaxRate(value: unknown): { id: string; name: string; rate: number | null; isDefault: boolean } | null {
  if (!isRecord(value)) return null
  const id = typeof value.id === "string" ? value.id : null
  const name = typeof value.name === "string" ? value.name : null
  if (id === null || name === null) return null
  const rateRaw = value.rate
  const rate = typeof rateRaw === "number" && Number.isFinite(rateRaw) ? rateRaw : null
  return { id, name, rate, isDefault: value.is_default === true }
}

function parseTaxRegion(value: unknown): TaxRegionRow | null {
  if (!isRecord(value)) return null
  const id = typeof value.id === "string" ? value.id : null
  const countryCodeRaw = value.country_code
  const countryCode =
    typeof countryCodeRaw === "string" && countryCodeRaw.trim() !== ""
      ? countryCodeRaw.trim().toLowerCase()
      : null
  if (id === null || countryCode === null) return null
  const ratesRaw = value.tax_rates
  const rates = Array.isArray(ratesRaw)
    ? ratesRaw.map(parseTaxRate).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    : []
  const defaultRate = rates.find((entry) => entry.isDefault) ?? rates[0] ?? null
  return {
    id,
    countryCode,
    rateId: defaultRate?.id ?? null,
    name: defaultRate?.name ?? "Standard rate",
    ratePercent: defaultRate?.rate ?? null,
  }
}

export async function listTaxRegions(): Promise<TaxRegionRow[]> {
  const params = new URLSearchParams({
    limit: "100",
    offset: "0",
    fields: "id,country_code,tax_rates.id,tax_rates.name,tax_rates.rate,tax_rates.is_default",
  })
  const response = await fetch(`${adminBase()}/admin/tax-regions?${params.toString()}`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
  const payload = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(payload)) throw new Error("Unexpected tax regions response.")
  const regions = payload.tax_regions
  if (!Array.isArray(regions)) return []
  return regions
    .map(parseTaxRegion)
    .filter((entry): entry is TaxRegionRow => entry !== null)
    .toSorted((left, right) => left.countryCode.localeCompare(right.countryCode))
}

export async function createTaxRegion(input: CreateTaxRegionInput): Promise<void> {
  const response = await fetch(`${adminBase()}/admin/tax-regions`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({
      country_code: input.countryCode.trim().toLowerCase(),
      provider_id: SYSTEM_TAX_PROVIDER_ID,
      default_tax_rate: {
        name: input.name.trim(),
        code: slugifyTaxCode(input.name),
        rate: input.ratePercent,
        is_combinable: false,
      },
    }),
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
}

export async function updateTaxRegionRate(input: UpdateTaxRegionInput): Promise<void> {
  const response = await fetch(`${adminBase()}/admin/tax-rates/${encodeURIComponent(input.rateId)}`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({ name: input.name.trim(), rate: input.ratePercent }),
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
}

export async function deleteTaxRegion(taxRegionId: string): Promise<void> {
  const response = await fetch(`${adminBase()}/admin/tax-regions/${encodeURIComponent(taxRegionId)}`, {
    method: "DELETE",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) throw new Error(await readMedusaAdminHttpErrorMessage(response))
}

export function validateTaxRegionForm(input: {
  countryCode: string
  name: string
  ratePercent: string
}): string | null {
  if (input.countryCode.trim() === "") return "Country is required."
  if (input.name.trim() === "") return "Tax name is required."
  const parsedRate = Number.parseFloat(input.ratePercent)
  if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 100) {
    return "Enter a tax rate between 0 and 100."
  }
  return null
}
