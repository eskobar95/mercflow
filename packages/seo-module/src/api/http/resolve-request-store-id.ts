import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

const STORE_ID_HEADER = "x-store-id"

/**
 * Resolves store id for public redirect middleware (T008 host mapping stub).
 * Uses `X-Store-Id` header or `MERCFLOW_DEFAULT_STORE_ID` until host→store mapping lands.
 */
export function resolveRequestStoreId(req: MedusaRequest): string | null {
  const header = req.headers[STORE_ID_HEADER]
  const headerValue = Array.isArray(header) ? header[0] : header
  if (typeof headerValue === "string" && headerValue.length > 0) {
    return headerValue
  }
  const envDefault = process.env.MERCFLOW_DEFAULT_STORE_ID
  if (typeof envDefault === "string" && envDefault.length > 0) {
    return envDefault
  }
  return null
}

export function resolveRequestStoreIdOrThrow(req: MedusaRequest): string {
  const storeId = resolveRequestStoreId(req)
  if (!storeId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cannot resolve store for redirect (set X-Store-Id or MERCFLOW_DEFAULT_STORE_ID)"
    )
  }
  return storeId
}
