import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type {
  MetafieldOwnerType,
  MetafieldValueDto,
  MetafieldValueType,
  MetafieldValueUpsertPayload,
} from "./types"
import { METAFIELD_OWNER_TYPES, METAFIELD_VALUE_TYPES } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isOwnerType(value: unknown): value is MetafieldOwnerType {
  return typeof value === "string" && (METAFIELD_OWNER_TYPES as readonly string[]).includes(value)
}

function isValueType(value: unknown): value is MetafieldValueType {
  return typeof value === "string" && (METAFIELD_VALUE_TYPES as readonly string[]).includes(value)
}

function parseMetafieldValueRow(raw: unknown): MetafieldValueDto | null {
  if (!isRecord(raw)) {
    return null
  }
  if (
    typeof raw.id !== "string" ||
    typeof raw.namespace !== "string" ||
    typeof raw.key !== "string" ||
    typeof raw.name !== "string" ||
    !isValueType(raw.type) ||
    typeof raw.locale !== "string"
  ) {
    return null
  }

  return {
    id: raw.id,
    namespace: raw.namespace,
    key: raw.key,
    name: raw.name,
    type: raw.type,
    value: raw.value,
    locale: raw.locale,
  }
}

function requireBackendUrl(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return base
}

export async function listMetafieldValues(params: {
  ownerType: MetafieldOwnerType
  ownerId: string
  locale?: string
}): Promise<MetafieldValueDto[]> {
  const base = requireBackendUrl()
  const search = new URLSearchParams({
    owner_type: params.ownerType,
    owner_id: params.ownerId,
  })
  if (params.locale) {
    search.set("locale", params.locale)
  }

  const response = await fetch(`${base}/admin/metafield-values?${search.toString()}`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(json) || !Array.isArray(json.metafield_values)) {
    throw new TypeError("Invalid API response: expected { metafield_values: array }")
  }

  return json.metafield_values
    .map((row) => parseMetafieldValueRow(row))
    .filter((row): row is MetafieldValueDto => row !== null)
}

export async function batchUpsertMetafieldValues(
  values: MetafieldValueUpsertPayload[]
): Promise<void> {
  if (values.length === 0) {
    return
  }

  const base = requireBackendUrl()
  const response = await fetch(`${base}/admin/metafield-values/batch`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({ values }),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  await parseMedusaAdminJsonResponse(response)
}
