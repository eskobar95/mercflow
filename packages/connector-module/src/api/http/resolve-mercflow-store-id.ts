import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

/**
 * Resolves tenant store for MercFlow connector admin routes.
 * Prefer explicit `?store_id=`; fall back to `MERCFLOW_DEFAULT_STORE_ID` for single-tenant dev.
 */
export function resolveMercflowStoreId(req: MedusaRequest): string {
  const rawQuery = req.query?.store_id
  if (typeof rawQuery === "string" && rawQuery.trim() !== "") {
    return rawQuery.trim()
  }

  const fromEnv = process.env.MERCFLOW_DEFAULT_STORE_ID?.trim()
  if (fromEnv !== undefined && fromEnv !== "") {
    return fromEnv
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "store_id query parameter or MERCFLOW_DEFAULT_STORE_ID is required"
  )
}
