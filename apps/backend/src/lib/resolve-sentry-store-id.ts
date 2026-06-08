import type { MedusaRequest } from "@medusajs/framework/http"
import { resolveStoreIdFromPublishableKey } from "@mercflow/seo-module/resolve-store-id-from-publishable-key"
import type { MercflowTenantRequest } from "@mercflow/seo-module/mercflow-public-tenant-middleware"

const STORE_ID_HEADER = "x-store-id"

function readStoreIdFromQuery(req: MedusaRequest): string | null {
  const query = req.query as { store_id?: string }
  if (typeof query.store_id === "string" && query.store_id.trim().length > 0) {
    return query.store_id.trim()
  }
  return null
}

function readStoreIdFromHeader(req: MedusaRequest): string | null {
  const header = req.headers[STORE_ID_HEADER]
  const headerValue = Array.isArray(header) ? header[0] : header
  if (typeof headerValue === "string" && headerValue.trim().length > 0) {
    return headerValue.trim()
  }
  return null
}

function readStoreIdFromEnv(env: NodeJS.ProcessEnv = process.env): string | null {
  const envDefault = env.MERCFLOW_DEFAULT_STORE_ID?.trim()
  return envDefault && envDefault.length > 0 ? envDefault : null
}

function readStoreIdFromTenantRequest(req: MedusaRequest): string | null {
  const storeId = (req as MercflowTenantRequest).mercflowStoreId
  return typeof storeId === "string" && storeId.length > 0 ? storeId : null
}

export async function resolveSentryStoreId(
  req: MedusaRequest,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | null> {
  const fromTenant = readStoreIdFromTenantRequest(req)
  if (fromTenant) return fromTenant
  const fromQuery = readStoreIdFromQuery(req)
  if (fromQuery) return fromQuery
  const fromHeader = readStoreIdFromHeader(req)
  if (fromHeader) return fromHeader
  try {
    const fromPublishableKey = await resolveStoreIdFromPublishableKey(req)
    if (fromPublishableKey) return fromPublishableKey
  } catch {
    // skip tagging when publishable key context is unavailable
  }
  return readStoreIdFromEnv(env)
}
