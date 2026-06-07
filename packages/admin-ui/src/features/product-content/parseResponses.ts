import type { ProductContentReadPayload } from "./types"

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

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value
  }
  return null
}

export function parseProductContentReadPayload(
  value: unknown
): ProductContentReadPayload | null {
  if (!isNonNullRecord(value)) {
    return null
  }
  const id = value["id"]
  const product_id = value["product_id"]
  const locale = value["locale"]
  const versionRaw = parseNumber(value["version"])
  if (typeof id !== "string" || id.length === 0) {
    return null
  }
  if (typeof product_id !== "string" || product_id.length === 0) {
    return null
  }
  if (typeof locale !== "string" || locale.length === 0) {
    return null
  }
  if (versionRaw === null) {
    return null
  }
  const statusRaw = value["status"]
  const status = typeof statusRaw === "string" && statusRaw.length > 0 ? statusRaw : "unknown"
  return {
    id,
    product_id,
    locale,
    version: versionRaw,
    body_json: value["body_json"] ?? null,
    seo_title: parseNullableString(value["seo_title"]),
    seo_description: parseNullableString(value["seo_description"]),
    og_image_url: parseNullableString(value["og_image_url"]),
    canonical_url_override: parseNullableString(value["canonical_url_override"]),
    status,
  }
}
