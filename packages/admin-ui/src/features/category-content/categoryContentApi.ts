import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type {
  CategoryContentReadPayload,
  CategoryContentResolved,
  SaveCategoryContentBody,
} from "./types"
import { parseCategoryContentEnvelope, parseCategoryContentReadPayload } from "./parseCategoryResponses"

export const DEFAULT_CATEGORY_CONTENT_LOCALE = "en"

export { resolveMedusaAdminBackendUrl }

function categoryContentPath(categoryId: string, locale: string): string {
  const params = new URLSearchParams()
  params.set("locale", locale)
  const q = params.toString()
  return `/admin/product-categories/${encodeURIComponent(categoryId)}/content?${q}`
}

function categoryContentMercflowReadPath(categoryId: string, locale: string): string {
  const params = new URLSearchParams()
  params.set("locale", locale)
  const q = params.toString()
  return `/admin/category-content/${encodeURIComponent(categoryId)}?${q}`
}

export async function getCategoryContent(
  categoryId: string,
  locale: string = DEFAULT_CATEGORY_CONTENT_LOCALE
): Promise<CategoryContentResolved | null> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}${categoryContentPath(categoryId, locale)}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  return parseCategoryContentEnvelope(json)
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

  const url = `${base}${categoryContentMercflowReadPath(categoryId, locale)}`
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

export async function saveCategoryContent(
  categoryId: string,
  body: SaveCategoryContentBody,
  locale: string = DEFAULT_CATEGORY_CONTENT_LOCALE
): Promise<CategoryContentResolved> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}${categoryContentPath(categoryId, locale)}`
  const response = await fetch(url, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const content = parseCategoryContentEnvelope(json)
  if (content === null) {
    throw new TypeError("Invalid API response: expected content after save")
  }
  return content
}
