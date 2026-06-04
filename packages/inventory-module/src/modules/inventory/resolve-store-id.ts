import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { assertMedusaStoreId } from "./tenant-scope"

/**
 * Resolves tenant store for MercFlow admin routes.
 * Prefer explicit `?store_id=`; fall back to `MERCFLOW_DEFAULT_STORE_ID` for single-tenant dev.
 */
export function resolveMercflowStoreId(req: MedusaRequest): string {
  const rawQuery = req.query?.store_id
  if (typeof rawQuery === "string" && rawQuery.trim() !== "") {
    const id = rawQuery.trim()
    assertMedusaStoreId(id)
    return id
  }

  const fromEnv = process.env.MERCFLOW_DEFAULT_STORE_ID?.trim()
  if (fromEnv !== undefined && fromEnv !== "") {
    assertMedusaStoreId(fromEnv)
    return fromEnv
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "store_id query parameter or MERCFLOW_DEFAULT_STORE_ID is required"
  )
}
