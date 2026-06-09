import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type {
  CreateMetafieldDefinitionPayload,
  MetafieldDefinitionDto,
  MetafieldOwnerType,
  MetafieldValueType,
  UpdateMetafieldDefinitionPayload,
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

function parseMetafieldDefinitionRow(raw: unknown): MetafieldDefinitionDto | null {
  if (!isRecord(raw)) {
    return null
  }
  if (
    typeof raw.id !== "string" ||
    !isOwnerType(raw.owner_type) ||
    typeof raw.namespace !== "string" ||
    typeof raw.key !== "string" ||
    typeof raw.name !== "string" ||
    !isValueType(raw.type) ||
    typeof raw.is_required !== "boolean" ||
    typeof raw.is_primary !== "boolean" ||
    typeof raw.is_standard !== "boolean" ||
    typeof raw.created_at !== "string" ||
    typeof raw.updated_at !== "string"
  ) {
    return null
  }

  return {
    id: raw.id,
    store_id: typeof raw.store_id === "string" ? raw.store_id : null,
    owner_type: raw.owner_type,
    namespace: raw.namespace,
    key: raw.key,
    name: raw.name,
    description: typeof raw.description === "string" ? raw.description : null,
    type: raw.type,
    validations: isRecord(raw.validations) ? raw.validations : null,
    pinned_position:
      typeof raw.pinned_position === "number" && Number.isFinite(raw.pinned_position)
        ? raw.pinned_position
        : null,
    is_required: raw.is_required,
    is_primary: raw.is_primary,
    category_constraint_id:
      typeof raw.category_constraint_id === "string" ? raw.category_constraint_id : null,
    is_standard: raw.is_standard,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
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

export async function listMetafieldDefinitions(params: {
  ownerType: MetafieldOwnerType
  categoryId?: string
}): Promise<MetafieldDefinitionDto[]> {
  const base = requireBackendUrl()
  const search = new URLSearchParams({ owner_type: params.ownerType })
  if (params.categoryId) {
    search.set("category_id", params.categoryId)
  }

  const response = await fetch(`${base}/admin/metafield-definitions?${search.toString()}`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(json) || !Array.isArray(json.metafield_definitions)) {
    throw new TypeError('Invalid API response: expected { metafield_definitions: array }')
  }

  return json.metafield_definitions
    .map((row) => parseMetafieldDefinitionRow(row))
    .filter((row): row is MetafieldDefinitionDto => row !== null)
}

export async function createMetafieldDefinition(
  payload: CreateMetafieldDefinitionPayload
): Promise<MetafieldDefinitionDto> {
  const base = requireBackendUrl()
  const response = await fetch(`${base}/admin/metafield-definitions`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(json)) {
    throw new TypeError('Invalid API response: expected { metafield_definition: object }')
  }
  const parsed = parseMetafieldDefinitionRow(json.metafield_definition)
  if (parsed === null) {
    throw new TypeError('Invalid API response: expected { metafield_definition: object }')
  }
  return parsed
}

export async function updateMetafieldDefinition(
  id: string,
  payload: UpdateMetafieldDefinitionPayload
): Promise<MetafieldDefinitionDto> {
  const base = requireBackendUrl()
  const response = await fetch(`${base}/admin/metafield-definitions/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(json)) {
    throw new TypeError('Invalid API response: expected { metafield_definition: object }')
  }
  const parsed = parseMetafieldDefinitionRow(json.metafield_definition)
  if (parsed === null) {
    throw new TypeError('Invalid API response: expected { metafield_definition: object }')
  }
  return parsed
}

export async function deleteMetafieldDefinition(id: string): Promise<void> {
  const base = requireBackendUrl()
  const response = await fetch(`${base}/admin/metafield-definitions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}
