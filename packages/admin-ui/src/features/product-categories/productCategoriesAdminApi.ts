import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import { parseAdminProductCategory } from "./parseAdminProductCategory"
import type { AdminProductCategoryParsed } from "./types"

/** Request enough relations to derive product counts without extra round-trips. */
const LIST_EXPAND = "products"

export type AdminProductCategoryListResult = {
  categories: AdminProductCategoryParsed[]
  count?: number
  limit?: number
  offset?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function parseProductCategoryListResponse(json: unknown): AdminProductCategoryListResult {
  if (!isRecord(json)) {
    return { categories: [] }
  }

  let rows: unknown[] | null = null
  if (Array.isArray(json.product_categories)) {
    rows = json.product_categories
  } else if (isRecord(json.data) && Array.isArray(json.data.product_categories)) {
    rows = json.data.product_categories
  }
  if (rows === null) {
    return { categories: [] }
  }

  const parsed: AdminProductCategoryParsed[] = []
  for (const row of rows) {
    const c = parseAdminProductCategory(row)
    if (c) {
      parsed.push(c)
    }
  }
  return {
    categories: parsed,
    count:
      readNumber(json.count) ??
      (isRecord(json.data) ? readNumber(json.data.count) : undefined),
    limit:
      readNumber(json.limit) ??
      (isRecord(json.data) ? readNumber(json.data.limit) : undefined),
    offset:
      readNumber(json.offset) ??
      (isRecord(json.data) ? readNumber(json.data.offset) : undefined),
  }
}

function parseSingleCategoryResponse(json: unknown): AdminProductCategoryParsed | null {
  if (!isRecord(json)) {
    return null
  }
  const direct = json.product_category
  if (direct !== undefined) {
    return parseAdminProductCategory(direct)
  }
  const data = json.data
  if (isRecord(data) && data.product_category !== undefined) {
    return parseAdminProductCategory(data.product_category)
  }
  return null
}

export async function listAdminProductCategories(options: {
  limit?: number
  offset?: number
  signal?: AbortSignal
}): Promise<AdminProductCategoryListResult> {
  const base = resolveMedusaAdminBackendUrl()
  if (!base) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  const params = new URLSearchParams({
    expand: LIST_EXPAND,
    limit: String(options.limit ?? 500),
    offset: String(options.offset ?? 0),
  })
  const response = await fetch(`${base}/admin/product-categories?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    signal: options.signal,
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  return parseProductCategoryListResponse(json)
}

export async function retrieveAdminProductCategory(
  categoryId: string,
  options?: { signal?: AbortSignal }
): Promise<AdminProductCategoryParsed | null> {
  const base = resolveMedusaAdminBackendUrl()
  if (!base) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  const params = new URLSearchParams({
    expand: "products,parent_category",
  })
  const response = await fetch(
    `${base}/admin/product-categories/${encodeURIComponent(categoryId)}?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      headers: buildMedusaAdminJsonHeaders(),
      signal: options?.signal,
    }
  )
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  return parseSingleCategoryResponse(json)
}
