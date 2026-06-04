import {
  appendMercflowStoreQuery,
  resolveMercflowStoreIdForAdmin,
} from "@/features/orders/resolveMercflowStoreId"
import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { SupplierDto, SupplierInput } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function requireBackendBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return base
}

function buildUrl(path: string): string {
  const base = requireBackendBase()
  const storeId = resolveMercflowStoreIdForAdmin()
  return appendMercflowStoreQuery(`${base}${path}`, storeId)
}

function parseSupplier(raw: unknown): SupplierDto | null {
  if (!isRecord(raw)) {
    return null
  }
  if (
    typeof raw.id !== "string" ||
    typeof raw.store_id !== "string" ||
    typeof raw.name !== "string" ||
    typeof raw.created_at !== "string" ||
    typeof raw.updated_at !== "string"
  ) {
    return null
  }
  return {
    id: raw.id,
    store_id: raw.store_id,
    name: raw.name,
    contact_person:
      raw.contact_person === null || typeof raw.contact_person === "string"
        ? (raw.contact_person as string | null)
        : null,
    email:
      raw.email === null || typeof raw.email === "string"
        ? (raw.email as string | null)
        : null,
    country:
      raw.country === null || typeof raw.country === "string"
        ? (raw.country as string | null)
        : null,
    currency:
      raw.currency === null || typeof raw.currency === "string"
        ? (raw.currency as string | null)
        : null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

export async function listSuppliersAdmin(): Promise<SupplierDto[]> {
  const res = await fetch(buildUrl("/admin/suppliers"), {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json) || !Array.isArray(json.suppliers)) {
    throw new Error("Invalid suppliers response")
  }
  const out: SupplierDto[] = []
  for (const row of json.suppliers) {
    const parsed = parseSupplier(row)
    if (parsed) {
      out.push(parsed)
    }
  }
  return out
}

export async function createSupplierAdmin(input: SupplierInput): Promise<SupplierDto> {
  const res = await fetch(buildUrl("/admin/suppliers"), {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json)) {
    throw new Error("Invalid create supplier response")
  }
  const parsed = parseSupplier(json.supplier)
  if (!parsed) {
    throw new Error("Invalid supplier payload")
  }
  return parsed
}

export async function updateSupplierAdmin(
  id: string,
  input: Partial<SupplierInput>
): Promise<SupplierDto> {
  const res = await fetch(buildUrl(`/admin/suppliers/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json)) {
    throw new Error("Invalid update supplier response")
  }
  const parsed = parseSupplier(json.supplier)
  if (!parsed) {
    throw new Error("Invalid supplier payload")
  }
  return parsed
}

export async function deleteSupplierAdmin(id: string): Promise<void> {
  const res = await fetch(buildUrl(`/admin/suppliers/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
}
