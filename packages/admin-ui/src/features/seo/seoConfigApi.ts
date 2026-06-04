import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { JsonLdSettingsDto, SeoConfigDto, SlugStrategy } from "./types"

function parseJsonLdSettings(raw: unknown): JsonLdSettingsDto {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { product: true, category: true, global: true }
  }
  const row = raw as Record<string, unknown>
  return {
    product: row.product === false ? false : true,
    category: row.category === false ? false : true,
    global: row.global === false ? false : true,
  }
}

function parseSeoConfigPayload(json: unknown): SeoConfigDto | null {
  if (typeof json !== "object" || json === null || !("seo_config" in json)) {
    return null
  }
  const raw = (json as Record<string, unknown>).seo_config
  if (typeof raw !== "object" || raw === null) {
    return null
  }
  const row = raw as Record<string, unknown>
  const strategy = row.slug_strategy
  if (strategy !== "nordic" && strategy !== "omit") {
    return null
  }
  if (typeof row.id !== "string" || typeof row.store_id !== "string") {
    return null
  }
  return {
    id: row.id,
    store_id: row.store_id,
    storefront_url:
      row.storefront_url === null || typeof row.storefront_url === "string"
        ? (row.storefront_url as string | null)
        : null,
    slug_strategy: strategy,
    org_name:
      row.org_name === null || typeof row.org_name === "string"
        ? (row.org_name as string | null)
        : null,
    org_logo_url:
      row.org_logo_url === null || typeof row.org_logo_url === "string"
        ? (row.org_logo_url as string | null)
        : null,
    org_social_urls:
      row.org_social_urls === null ||
      (typeof row.org_social_urls === "object" && !Array.isArray(row.org_social_urls))
        ? (row.org_social_urls as Record<string, unknown> | null)
        : null,
    json_ld_settings: parseJsonLdSettings(row.json_ld_settings),
  }
}

export async function getAdminSeoConfig(): Promise<SeoConfigDto> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const response = await fetch(`${base}/admin/seo-config`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseSeoConfigPayload(json)
  if (parsed === null) {
    throw new TypeError('Invalid API response: expected { seo_config: object }')
  }
  return parsed
}

export type PutAdminSeoConfigPayload = {
  slug_strategy?: SlugStrategy
  storefront_url?: string | null
  org_name?: string | null
  org_logo_url?: string | null
  org_social_urls?: Record<string, unknown> | null
  json_ld_settings?: JsonLdSettingsDto
}

export async function putAdminSeoConfig(payload: PutAdminSeoConfigPayload): Promise<SeoConfigDto> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const response = await fetch(`${base}/admin/seo-config`, {
    method: "PUT",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseSeoConfigPayload(json)
  if (parsed === null) {
    throw new TypeError('Invalid API response: expected { seo_config: object }')
  }
  return parsed
}
