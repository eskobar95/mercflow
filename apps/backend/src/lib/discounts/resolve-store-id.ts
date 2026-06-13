import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

const STORE_ID_HEADER = "x-store-id"

type MercflowAdminRequest = MedusaRequest & {
  mercflowStoreId?: string
}

function assertMedusaStoreId(storeId: string): void {
  if (storeId.trim() === "") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "store_id must be a non-empty string")
  }
}

function readStoreIdFromJwt(req: MedusaRequest): string | null {
  const fromJwt = (req as MercflowAdminRequest).mercflowStoreId
  if (typeof fromJwt === "string" && fromJwt.trim() !== "") {
    return fromJwt.trim()
  }
  return null
}

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
 * Resolves tenant store for MercFlow admin discount routes.
 * Prefer Clerk JWT org_id (`req.mercflowStoreId`); then explicit query/header; then dev env fallback.
 */
export function resolveMercflowStoreId(req: MedusaRequest): string {
  const fromJwt = readStoreIdFromJwt(req)
  if (fromJwt !== null) {
    assertMedusaStoreId(fromJwt)
    return fromJwt
  }

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
    MedusaError.Types.UNAUTHORIZED,
    "store_id from JWT or store_id query parameter is required"
  )
}
