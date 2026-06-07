import type { CategoryContentReadPayload } from "./types"

function isNonNullRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseNullableString(value: unknown): string | null {
  if (value === null) {
    return null
  }
  if (typeof value === "string") {
    return value
  }
  return null
}

function parseNonNegativeInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }
  if (value < 0) {
    return null
  }
  return Math.trunc(value)
}

export function parseCategoryContentReadPayload(
  value: unknown
): CategoryContentReadPayload | null {
  if (!isNonNullRecord(value)) {
    return null
  }
  const id = value["id"]
  const category_id = value["category_id"]
  const locale = value["locale"]
  const version = parseNonNegativeInteger(value["version"])
  if (typeof id !== "string" || id.length === 0) {
    return null
  }
  if (typeof category_id !== "string" || category_id.length === 0) {
    return null
  }
  if (typeof locale !== "string" || locale.length === 0) {
    return null
  }
  if (version === null) {
    return null
  }
  const statusRaw = value["status"]
  const status = typeof statusRaw === "string" && statusRaw.length > 0 ? statusRaw : "unknown"
  return {
    id,
    category_id,
    locale,
    version,
    body_json: value["body_json"] ?? null,
    seo_title: parseNullableString(value["seo_title"]),
    seo_description: parseNullableString(value["seo_description"]),
    og_image_url: parseNullableString(value["og_image_url"]),
    banner_image_url: parseNullableString(value["banner_image_url"]),
    status,
  }
}
