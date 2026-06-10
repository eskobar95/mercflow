import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type {
  PackagingTypeDto,
  PackagingTypeKind,
  SuggestPackagingItemInput,
  SuggestPackagingResult,
} from "./packagingTypes"

const PACKAGING_TYPE_KINDS: readonly PackagingTypeKind[] = [
  "box",
  "envelope",
  "bag",
  "tube",
  "other",
]

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function isPackagingTypeKind(value: string): value is PackagingTypeKind {
  return (PACKAGING_TYPE_KINDS as readonly string[]).includes(value)
}

function parsePackagingTypeDto(raw: unknown): PackagingTypeDto | null {
  if (!isRecord(raw)) {
    return null
  }
  const id = raw.id
  const storeId = raw.store_id
  const name = raw.name
  const type = raw.type
  const lengthMm = raw.length_mm
  const widthMm = raw.width_mm
  const heightMm = raw.height_mm
  const maxWeightG = raw.max_weight_g
  const isActive = raw.is_active
  const createdAt = raw.created_at
  const updatedAt = raw.updated_at
  const deletedAt = raw.deleted_at
  if (
    typeof id !== "string" ||
    typeof storeId !== "string" ||
    typeof name !== "string" ||
    typeof type !== "string" ||
    !isPackagingTypeKind(type) ||
    typeof lengthMm !== "number" ||
    typeof widthMm !== "number" ||
    typeof heightMm !== "number" ||
    typeof maxWeightG !== "number" ||
    typeof isActive !== "boolean" ||
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    return null
  }
  return {
    id,
    store_id: storeId,
    name,
    type,
    length_mm: lengthMm,
    width_mm: widthMm,
    height_mm: heightMm,
    max_weight_g: maxWeightG,
    is_active: isActive,
    created_at: createdAt,
    updated_at: updatedAt,
    deleted_at: deletedAt === null || typeof deletedAt === "string" ? deletedAt : null,
  }
}

function requireBackendBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000).",
    )
  }
  return base
}

export async function fetchActivePackagingTypes(): Promise<PackagingTypeDto[]> {
  const base = requireBackendBase()
  const params = new URLSearchParams({ limit: "100", offset: "0" })
  const response = await fetch(`${base}/admin/packaging-types?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const body = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(body) || !Array.isArray(body.packaging_types)) {
    throw new TypeError("Invalid packaging types list response")
  }
  const rows: PackagingTypeDto[] = []
  for (const item of body.packaging_types) {
    const parsed = parsePackagingTypeDto(item)
    if (parsed !== null && parsed.is_active && parsed.deleted_at === null) {
      rows.push(parsed)
    }
  }
  return rows
}

export async function suggestPackagingForOrderItems(
  items: SuggestPackagingItemInput[],
): Promise<SuggestPackagingResult> {
  const base = requireBackendBase()
  const response = await fetch(`${base}/admin/packaging-types/suggest`, {
    method: "POST",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    body: JSON.stringify({ items }),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const body = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(body)) {
    throw new TypeError("Invalid packaging suggestion response")
  }
  const totalVolume = body.total_volume_mm3
  const totalWeight = body.total_weight_g
  if (typeof totalVolume !== "number" || typeof totalWeight !== "number") {
    throw new TypeError("Invalid packaging suggestion response: missing totals")
  }
  const suggestedRaw = body.suggested
  const suggested =
    suggestedRaw === null
      ? null
      : parsePackagingTypeDto(suggestedRaw)
  if (suggestedRaw !== null && suggested === null) {
    throw new TypeError("Invalid packaging suggestion response: malformed suggested type")
  }
  return {
    suggested,
    total_volume_mm3: totalVolume,
    total_weight_g: totalWeight,
  }
}
