import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { ProductContentReadPayload, SaveProductContentBody } from "./types"
import { parseProductContentReadPayload } from "./parseResponses"

export const DEFAULT_PRODUCT_CONTENT_LOCALE = "en"

export { resolveMedusaAdminBackendUrl }

function adminProductContentReadPath(productId: string, locale: string): string {
  const params = new URLSearchParams()
  params.set("locale", locale)
  const q = params.toString()
  return `/admin/product-content/${encodeURIComponent(productId)}?${q}`
}

function adminProductContentCollectionPath(locale: string): string {
  const params = new URLSearchParams()
  params.set("locale", locale)
  return `/admin/product-content?${params.toString()}`
}

function adminProductContentPatchPath(cmsRowId: string): string {
  return `/admin/product-content/${encodeURIComponent(cmsRowId)}`
}

export async function getProductContent(
  productId: string,
  locale: string = DEFAULT_PRODUCT_CONTENT_LOCALE
): Promise<ProductContentReadPayload | null> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}${adminProductContentReadPath(productId, locale)}`
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
  const parsed = parseProductContentReadPayload(json)
  if (parsed === null) {
    throw new TypeError("Invalid API response: unexpected MercFlow CMS payload shape")
  }
  return parsed
}

/**
 * Persist product CMS fields.
 * Uses `POST /admin/product-content` when no row exists yet, otherwise `PATCH /admin/product-content/:cms_row_id`.
 */
export async function saveProductContent(options: {
  productId: string
  cmsContentId: string | null
  body: SaveProductContentBody
  locale?: string
}): Promise<ProductContentReadPayload> {
  const locale = options.locale ?? DEFAULT_PRODUCT_CONTENT_LOCALE
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const patchPath = adminProductContentPatchPath(options.cmsContentId ?? "")
  const url =
    options.cmsContentId !== null
      ? `${base}${patchPath}`
      : `${base}${adminProductContentCollectionPath(locale)}`

  const bodyJson =
    options.cmsContentId !== null ? options.body : { product_id: options.productId, ...options.body }

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
  const content = parseProductContentReadPayload(json)
  if (content === null) {
    throw new TypeError("Invalid API response: expected MercFlow CMS payload after save")
  }
  return content
}
