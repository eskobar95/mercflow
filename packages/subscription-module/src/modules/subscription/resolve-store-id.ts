import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { assertMedusaStoreId } from "./tenant-scope"

const STORE_ID_HEADER = "x-store-id"

function readStoreIdFromQuery(req: MedusaRequest): string | null {
  const rawQuery = req.query?.store_id
  if (typeof rawQuery === "string" && rawQuery.trim() !== "") {
    return rawQuery.trim()
  }
  return null
}

function readStoreIdFromHeader(req: MedusaRequest): string | null {
  const header = req.headers[STORE_ID_HEADER]
  const headerValue = Array.isArray(header) ? header[0] : header
  if (typeof headerValue === "string" && headerValue.trim() !== "") {
    return headerValue.trim()
  }
  return null
}

function readStoreIdFromEnv(): string | null {
  const fromEnv = process.env.MERCFLOW_DEFAULT_STORE_ID?.trim()
  return fromEnv !== undefined && fromEnv !== "" ? fromEnv : null
}

/**
 * Resolves tenant store for MercFlow admin routes.
 * Prefer explicit `?store_id=`; fall back to `MERCFLOW_DEFAULT_STORE_ID` for single-tenant dev.
 */
export function resolveMercflowStoreId(req: MedusaRequest): string {
  const fromQuery = readStoreIdFromQuery(req)
  if (fromQuery !== null) {
    assertMedusaStoreId(fromQuery)
    return fromQuery
  }

  const fromHeader = readStoreIdFromHeader(req)
  if (fromHeader !== null) {
    assertMedusaStoreId(fromHeader)
    return fromHeader
  }

  const fromEnv = readStoreIdFromEnv()
  if (fromEnv !== null) {
    assertMedusaStoreId(fromEnv)
    return fromEnv
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "store_id query parameter or MERCFLOW_DEFAULT_STORE_ID is required"
  )
}
