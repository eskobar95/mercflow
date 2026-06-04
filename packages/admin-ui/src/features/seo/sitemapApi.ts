import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { SitemapConfigDto, SitemapPageType, SitemapPageTypeSetting } from "./types"

function parseSitemapConfig(json: unknown): SitemapConfigDto | null {
  if (typeof json !== "object" || json === null || !("sitemap_config" in json)) {
    return null
  }
  const raw = (json as Record<string, unknown>).sitemap_config
  if (typeof raw !== "object" || raw === null) {
    return null
  }
  const row = raw as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.store_id !== "string") {
    return null
  }
  const page_type_settings =
    typeof row.page_type_settings === "object" &&
    row.page_type_settings !== null &&
    !Array.isArray(row.page_type_settings)
      ? (row.page_type_settings as SitemapConfigDto["page_type_settings"])
      : {}
  return {
    id: row.id,
    store_id: row.store_id,
    page_type_settings,
    excluded_product_ids: Array.isArray(row.excluded_product_ids)
      ? (row.excluded_product_ids as string[])
      : [],
    excluded_category_ids: Array.isArray(row.excluded_category_ids)
      ? (row.excluded_category_ids as string[])
      : [],
    excluded_page_ids: Array.isArray(row.excluded_page_ids)
      ? (row.excluded_page_ids as string[])
      : [],
  }
}

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return fetch(`${base}${path}`, {
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    ...init,
  })
}

export async function getAdminSitemapConfig(): Promise<SitemapConfigDto> {
  const response = await adminFetch("/admin/sitemap-config", { method: "GET" })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseSitemapConfig(json)
  if (parsed === null) {
    throw new TypeError('Invalid API response: expected { sitemap_config: object }')
  }
  return parsed
}

export async function putAdminSitemapConfig(payload: {
  page_type_settings?: Partial<Record<SitemapPageType, SitemapPageTypeSetting>>
  excluded_product_ids?: string[]
  excluded_category_ids?: string[]
  excluded_page_ids?: string[]
}): Promise<SitemapConfigDto> {
  const response = await adminFetch("/admin/sitemap-config", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseSitemapConfig(json)
  if (parsed === null) {
    throw new TypeError('Invalid API response: expected { sitemap_config: object }')
  }
  return parsed
}

export async function getAdminSitemapPreview(): Promise<string> {
  const response = await adminFetch("/admin/sitemap/preview", { method: "GET" })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  if (typeof json !== "object" || json === null || typeof (json as { xml?: unknown }).xml !== "string") {
    throw new TypeError('Invalid API response: expected { xml: string }')
  }
  return (json as { xml: string }).xml
}

export async function postAdminSitemapRegenerate(): Promise<{ regenerated_at: string }> {
  const response = await adminFetch("/admin/sitemap/regenerate", { method: "POST" })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  if (
    typeof json !== "object" ||
    json === null ||
    typeof (json as { regenerated_at?: unknown }).regenerated_at !== "string"
  ) {
    throw new TypeError('Invalid API response: expected { regenerated_at: string }')
  }
  return { regenerated_at: (json as { regenerated_at: string }).regenerated_at }
}
