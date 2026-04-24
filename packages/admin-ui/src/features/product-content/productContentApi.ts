import type { ProductContentResolved, SaveProductContentBody } from "./types"

import { parseProductContentEnvelope } from "./parseResponses"

export const DEFAULT_PRODUCT_CONTENT_LOCALE = "en"

export function resolveMedusaAdminBackendUrl(): string | null {
  const raw = import.meta.env.VITE_MEDUSA_ADMIN_BACKEND_URL
  if (typeof raw !== "string" || raw.trim() === "") {
    return null
  }
  return raw.replace(/\/$/, "")
}

function buildJsonHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  const token = import.meta.env.VITE_MEDUSA_ADMIN_BEARER_TOKEN
  if (typeof token === "string" && token.trim() !== "") {
    headers["Authorization"] = `Bearer ${token.trim()}`
  }
  return headers
}

function productContentPath(productId: string, locale: string): string {
  const params = new URLSearchParams()
  params.set("locale", locale)
  const q = params.toString()
  return `/admin/products/${encodeURIComponent(productId)}/content?${q}`
}

async function readHttpErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  if (text.trim() === "") {
    return `Request failed (${response.status} ${response.statusText})`
  }
  try {
    const parsed: unknown = JSON.parse(text)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
    ) {
      return (parsed as { message: string }).message
    }
  } catch {
    // use raw text
  }
  return text
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text.trim() === "") {
    throw new TypeError("Empty response body")
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new TypeError("Response is not valid JSON")
  }
}

export async function getProductContent(
  productId: string,
  locale: string = DEFAULT_PRODUCT_CONTENT_LOCALE
): Promise<ProductContentResolved | null> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}${productContentPath(productId, locale)}`
  const response = await fetch(url, {
    method: "GET",
    headers: buildJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response))
  }

  const json = await parseJsonResponse(response)
  return parseProductContentEnvelope(json)
}

export async function saveProductContent(
  productId: string,
  body: SaveProductContentBody,
  locale: string = DEFAULT_PRODUCT_CONTENT_LOCALE
): Promise<ProductContentResolved> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const url = `${base}${productContentPath(productId, locale)}`
  const response = await fetch(url, {
    method: "POST",
    headers: buildJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response))
  }

  const json = await parseJsonResponse(response)
  const content = parseProductContentEnvelope(json)
  if (content === null) {
    throw new TypeError("Invalid API response: expected content after save")
  }
  return content
}
