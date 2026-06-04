import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { SeoConfigDto, SlugStrategy } from "./types"

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

export async function putAdminSeoConfig(payload: {
  slug_strategy: SlugStrategy
}): Promise<SeoConfigDto> {
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
