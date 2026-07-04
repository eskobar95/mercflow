import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type {
  CategoryContentReadPayload,
  SaveCategoryContentBody,
} from "./types"
import { parseCategoryContentReadPayload } from "./parseCategoryResponses"

export const DEFAULT_CATEGORY_CONTENT_LOCALE = "en"

export { resolveMedusaAdminBackendUrl }

function categoryContentReadPath(categoryId: string, locale: string): string {
  const params = new URLSearchParams()
  params.set("locale", locale)
  return `/admin/category-content/${encodeURIComponent(categoryId)}?${params.toString()}`
}

function categoryContentCollectionPath(locale: string): string {
  const params = new URLSearchParams()
  params.set("locale", locale)
  return `/admin/category-content?${params.toString()}`
}

function categoryContentPatchPath(cmsRowId: string): string {
  return `/admin/category-content/${encodeURIComponent(cmsRowId)}`
}

export async function getCategoryContentRead(
  categoryId: string,
  locale: string = DEFAULT_CATEGORY_CONTENT_LOCALE
): Promise<CategoryContentReadPayload | null> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}${categoryContentReadPath(categoryId, locale)}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseCategoryContentReadPayload(json)
  if (parsed === null) {
    throw new TypeError("Invalid API response: unexpected MercFlow CMS category payload shape")
  }
  return parsed
}

/**
 * Persist category CMS fields. Uses `POST /admin/category-content` when no row exists yet,
 * otherwise `PATCH /admin/category-content/:cms_row_id`.
 */
export async function saveCategoryContent(options: {
  categoryId: string
  cmsContentId: string | null
  body: SaveCategoryContentBody
  locale?: string
}): Promise<CategoryContentReadPayload> {
  const locale = options.locale ?? DEFAULT_CATEGORY_CONTENT_LOCALE
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const patchPath = categoryContentPatchPath(options.cmsContentId ?? "")
  const url =
    options.cmsContentId !== null
      ? `${base}${patchPath}`
      : `${base}${categoryContentCollectionPath(locale)}`

  const bodyJson =
    options.cmsContentId !== null
      ? options.body
      : { category_id: options.categoryId, ...options.body }

  const response = await fetch(url, {
    method: options.cmsContentId !== null ? "PATCH" : "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(bodyJson),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const content = parseCategoryContentReadPayload(json)
  if (content === null) {
    throw new TypeError("Invalid API response: expected MercFlow CMS payload after save")
  }
  return content
}
