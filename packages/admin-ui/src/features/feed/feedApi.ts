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

import type {
  FeedConfigDto,
  FeedConfigResponseDto,
  FeedConfigUpdateInput,
  FeedValidationResponseDto,
} from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseIdList(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) {
    return null
  }
  const ids: string[] = []
  for (const entry of raw) {
    if (typeof entry !== "string" || entry.length === 0) {
      return null
    }
    ids.push(entry)
  }
  return ids
}

function parseFeedConfig(raw: unknown): FeedConfigDto | null {
  if (!isRecord(raw)) {
    return null
  }
  const excludedProducts = parseIdList(raw.excluded_product_ids)
  const excludedCategories = parseIdList(raw.excluded_category_ids)
  if (
    typeof raw.id !== "string" ||
    typeof raw.store_id !== "string" ||
    excludedProducts === null ||
    excludedCategories === null ||
    typeof raw.default_condition !== "string"
  ) {
    return null
  }
  const storefront =
    raw.storefront_url === null || raw.storefront_url === undefined
      ? null
      : typeof raw.storefront_url === "string"
        ? raw.storefront_url
        : null
  return {
    id: raw.id,
    store_id: raw.store_id,
    storefront_url: storefront,
    excluded_product_ids: excludedProducts,
    excluded_category_ids: excludedCategories,
    default_condition: raw.default_condition,
  }
}

function parseOverview(raw: unknown): FeedConfigResponseDto["overview"] | null {
  if (!isRecord(raw)) {
    return null
  }
  if (
    typeof raw.product_count !== "number" ||
    typeof raw.variant_count !== "number" ||
    typeof raw.validation_issue_count !== "number"
  ) {
    return null
  }
  const lastUpdated =
    raw.last_updated_at === null || raw.last_updated_at === undefined
      ? null
      : typeof raw.last_updated_at === "string"
        ? raw.last_updated_at
        : null
  const feedUrl =
    raw.feed_url === null || raw.feed_url === undefined
      ? null
      : typeof raw.feed_url === "string"
        ? raw.feed_url
        : null
  return {
    product_count: raw.product_count,
    variant_count: raw.variant_count,
    validation_issue_count: raw.validation_issue_count,
    last_updated_at: lastUpdated,
    feed_url: feedUrl,
  }
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

function buildFeedConfigUrl(path: string): string {
  const base = requireBackendBase()
  const storeId = resolveMercflowStoreIdForAdmin()
  return appendMercflowStoreQuery(`${base}${path}`, storeId)
}

function parseFeedConfigResponse(json: unknown): FeedConfigResponseDto | null {
  if (!isRecord(json) || !("overview" in json)) {
    return null
  }
  const overview = parseOverview(json.overview)
  if (overview === null) {
    return null
  }
  const configRaw = json.feed_config
  const feedConfig =
    configRaw === null || configRaw === undefined ? null : parseFeedConfig(configRaw)
  if (configRaw !== null && configRaw !== undefined && feedConfig === null) {
    return null
  }
  return { feed_config: feedConfig, overview }
}

export async function getAdminFeedConfig(): Promise<FeedConfigResponseDto> {
  const response = await fetch(buildFeedConfigUrl("/admin/feed-config"), {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseFeedConfigResponse(json)
  if (parsed === null) {
    throw new TypeError("Invalid API response: expected feed config payload")
  }
  return parsed
}

export async function putAdminFeedConfig(
  body: FeedConfigUpdateInput
): Promise<FeedConfigResponseDto> {
  const response = await fetch(buildFeedConfigUrl("/admin/feed-config"), {
    method: "PUT",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseFeedConfigResponse(json)
  if (parsed === null) {
    throw new TypeError("Invalid API response: expected feed config payload")
  }
  return parsed
}

export async function getAdminFeedValidation(
  locale?: string
): Promise<FeedValidationResponseDto> {
  let url = buildFeedConfigUrl("/admin/feed/validate")
  if (locale !== undefined && locale.trim() !== "") {
    url += `${url.includes("?") ? "&" : "?"}locale=${encodeURIComponent(locale)}`
  }
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  if (!isRecord(json) || !isRecord(json.validation)) {
    throw new TypeError("Invalid API response: expected validation report")
  }
  const validation = json.validation
  if (!Array.isArray(validation.issues) || !isRecord(validation.summary)) {
    throw new TypeError("Invalid API response: expected validation report")
  }
  const summary = validation.summary
  if (
    typeof summary.products_checked !== "number" ||
    typeof summary.products_with_issues !== "number" ||
    typeof summary.issue_count !== "number"
  ) {
    throw new TypeError("Invalid API response: expected validation summary")
  }
  const issues = validation.issues.flatMap((row) => {
    if (!isRecord(row)) {
      return []
    }
    if (
      typeof row.product_id !== "string" ||
      !Array.isArray(row.missing_fields) ||
      !row.missing_fields.every((f) => typeof f === "string")
    ) {
      return []
    }
    return [
      {
        product_id: row.product_id,
        product_title:
          typeof row.product_title === "string" ? row.product_title : null,
        variant_id: typeof row.variant_id === "string" ? row.variant_id : null,
        variant_sku: typeof row.variant_sku === "string" ? row.variant_sku : null,
        missing_fields: row.missing_fields,
      },
    ]
  })
  return {
    validation: {
      issues,
      summary: {
        products_checked: summary.products_checked,
        products_with_issues: summary.products_with_issues,
        issue_count: summary.issue_count,
      },
    },
  }
}
