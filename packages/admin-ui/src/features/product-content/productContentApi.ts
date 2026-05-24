import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { ProductContentReadPayload, SaveProductContentBody } from "./types"
import { parseProductContentEnvelope, parseProductContentReadPayload } from "./parseResponses"

export const DEFAULT_PRODUCT_CONTENT_LOCALE = "en"

export { resolveMedusaAdminBackendUrl }

function adminProductContentReadPath(productId: string, locale: string): string {
  const params = new URLSearchParams()
  params.set("locale", locale)
  const q = params.toString()
  return `/admin/product-content/${encodeURIComponent(productId)}?${q}`
}

function adminProductUpsertContentPath(productId: string, locale: string): string {
  const params = new URLSearchParams()
  params.set("locale", locale)
  const q = params.toString()
  return `/admin/products/${encodeURIComponent(productId)}/content?${q}`
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
  return parseProductContentReadPayload(json)
}

export async function saveProductContent(
  productId: string,
  body: SaveProductContentBody,
  locale: string = DEFAULT_PRODUCT_CONTENT_LOCALE
): Promise<void> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}${adminProductUpsertContentPath(productId, locale)}`
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
  const content = parseProductContentEnvelope(json)
  if (content === null) {
    throw new TypeError("Invalid API response: expected content after save")
  }
}
