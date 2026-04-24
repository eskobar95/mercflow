import type { ProductContentResolved } from "./types"

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

function parseStringArrayOrNull(value: unknown): string[] | null {
  if (value === null) {
    return null
  }
  if (!Array.isArray(value)) {
    return null
  }
  if (!value.every((item): item is string => typeof item === "string")) {
    return null
  }
  return value
}

export function parseResolvedProductContent(
  value: unknown
): ProductContentResolved | null {
  if (!isNonNullRecord(value)) {
    return null
  }
  const id = value["id"]
  const product_id = value["product_id"]
  const locale = value["locale"]
  if (typeof id !== "string" || typeof product_id !== "string" || typeof locale !== "string") {
    return null
  }
  return {
    id,
    product_id,
    locale,
    description_rich: value["description_rich"] ?? null,
    seo_title: parseNullableString(value["seo_title"]),
    seo_description: parseNullableString(value["seo_description"]),
    seo_og_image_id: parseNullableString(value["seo_og_image_id"]),
    media_gallery: parseStringArrayOrNull(value["media_gallery"]),
  }
}

export function parseProductContentEnvelope(json: unknown): ProductContentResolved | null {
  if (!isNonNullRecord(json)) {
    throw new TypeError("Invalid API response: expected a JSON object")
  }
  const content = json["content"]
  if (content === null) {
    return null
  }
  const parsed = parseResolvedProductContent(content)
  if (parsed === null) {
    throw new TypeError("Invalid API response: unexpected content shape")
  }
  return parsed
}
