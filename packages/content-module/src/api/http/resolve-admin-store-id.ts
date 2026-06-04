import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

const STORE_ID_HEADER = "x-store-id"

/**
 * Resolves tenant store id for admin content routes.
 * Order: query `store_id` → `X-Store-Id` header → `MERCFLOW_DEFAULT_STORE_ID` env.
 */
export function resolveAdminStoreId(req: MedusaRequest): string {
  const query = (req.query ?? {}) as { store_id?: string }
  if (typeof query.store_id === "string" && query.store_id.length > 0) {
    return query.store_id
  }
  const header = req.headers[STORE_ID_HEADER]
  const headerValue = Array.isArray(header) ? header[0] : header
  if (typeof headerValue === "string" && headerValue.length > 0) {
    return headerValue
  }
  const envDefault = process.env.MERCFLOW_DEFAULT_STORE_ID
  if (typeof envDefault === "string" && envDefault.length > 0) {
    return envDefault
  }
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "store_id is required (query, X-Store-Id header, or MERCFLOW_DEFAULT_STORE_ID)"
  )
}
