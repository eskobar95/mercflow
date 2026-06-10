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

import { PACKAGING_TYPE_KINDS } from "./types"
import type {
  CreatePackagingTypeInput,
  PackagingTypeDto,
  PackagingTypeKind,
  UpdatePackagingTypeInput,
} from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isPackagingTypeKind(value: unknown): value is PackagingTypeKind {
  return (
    typeof value === "string" &&
    (PACKAGING_TYPE_KINDS as readonly string[]).includes(value)
  )
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

function parsePackagingType(raw: unknown): PackagingTypeDto | null {
  if (!isRecord(raw)) {
    return null
  }
  if (
    typeof raw.id !== "string" ||
    typeof raw.store_id !== "string" ||
    typeof raw.name !== "string" ||
    !isPackagingTypeKind(raw.type) ||
    typeof raw.length_mm !== "number" ||
    !Number.isFinite(raw.length_mm) ||
    typeof raw.width_mm !== "number" ||
    !Number.isFinite(raw.width_mm) ||
    typeof raw.height_mm !== "number" ||
    !Number.isFinite(raw.height_mm) ||
    typeof raw.max_weight_g !== "number" ||
    !Number.isFinite(raw.max_weight_g) ||
    typeof raw.is_active !== "boolean" ||
    typeof raw.created_at !== "string" ||
    typeof raw.updated_at !== "string"
  ) {
    return null
  }
  return {
    id: raw.id,
    store_id: raw.store_id,
    name: raw.name,
    type: raw.type,
    length_mm: Math.trunc(raw.length_mm),
    width_mm: Math.trunc(raw.width_mm),
    height_mm: Math.trunc(raw.height_mm),
    max_weight_g: Math.trunc(raw.max_weight_g),
    is_active: raw.is_active,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    deleted_at:
      raw.deleted_at === null || typeof raw.deleted_at === "string"
        ? (raw.deleted_at as string | null)
        : null,
  }
}

export async function listPackagingTypesAdmin(): Promise<PackagingTypeDto[]> {
  const res = await fetch(buildUrl("/admin/packaging-types"), {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json) || !Array.isArray(json.packaging_types)) {
    throw new Error("Invalid packaging types response")
  }
  const out: PackagingTypeDto[] = []
  for (const row of json.packaging_types) {
    const parsed = parsePackagingType(row)
    if (parsed) {
      out.push(parsed)
    }
  }
  return out
}

export async function createPackagingTypeAdmin(
  input: CreatePackagingTypeInput
): Promise<PackagingTypeDto> {
  const res = await fetch(buildUrl("/admin/packaging-types"), {
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
    throw new Error("Invalid create packaging type response")
  }
  const parsed = parsePackagingType(json.packaging_type)
  if (!parsed) {
    throw new Error("Invalid packaging type payload")
  }
  return parsed
}

export async function updatePackagingTypeAdmin(
  id: string,
  input: UpdatePackagingTypeInput
): Promise<PackagingTypeDto> {
  const res = await fetch(buildUrl(`/admin/packaging-types/${encodeURIComponent(id)}`), {
    method: "PUT",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
  const json = await parseMedusaAdminJsonResponse(res)
  if (!isRecord(json)) {
    throw new Error("Invalid update packaging type response")
  }
  const parsed = parsePackagingType(json.packaging_type)
  if (!parsed) {
    throw new Error("Invalid packaging type payload")
  }
  return parsed
}

export async function deletePackagingTypeAdmin(id: string): Promise<void> {
  const res = await fetch(buildUrl(`/admin/packaging-types/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!res.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(res))
  }
}
