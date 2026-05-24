import type { AdminProductCategoryParsed, ParentCategorySummary } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function readNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }
  return typeof value === "string" ? value : null
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function readNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function parseParentSummary(value: unknown): ParentCategorySummary | null {
  if (!isRecord(value)) {
    return null
  }
  const id = readString(value.id)
  const name = readString(value.name)
  if (!id || !name) {
    return null
  }
  return { id, name }
}

function countProductsField(value: unknown): number {
  if (!Array.isArray(value)) {
    return 0
  }
  return value.length
}

/**
 * Parses one Medusa Admin `AdminProductCategory` object from an unknown JSON value.
 * Returns null when required fields are missing.
 */
export function parseAdminProductCategory(value: unknown): AdminProductCategoryParsed | null {
  if (!isRecord(value)) {
    return null
  }
  const id = readString(value.id)
  const name = readString(value.name)
  const handle = readString(value.handle)
  const created_at = readString(value.created_at)
  const updated_at = readString(value.updated_at)
  if (!id || !name || !handle || !created_at || !updated_at) {
    return null
  }

  const is_active = readBoolean(value.is_active) ?? false
  const parentRaw = value.parent_category_id
  const parent_category_id =
    parentRaw === null || parentRaw === undefined
      ? null
      : readString(parentRaw) ?? null

  return {
    id,
    name,
    handle,
    description: readNullableString(value.description),
    parent_category_id,
    is_active,
    rank: readNumberOrNull(value.rank),
    created_at,
    updated_at,
    productCount: countProductsField(value.products),
    parent_category: parseParentSummary(value.parent_category),
  }
}
