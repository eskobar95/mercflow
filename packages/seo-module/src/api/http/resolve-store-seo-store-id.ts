import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import {
  resolveStoreIdFromHost,
  type StorefrontUrlLookup,
} from "../../modules/seo/tenant-resolver"
import { assertMedusaStoreId } from "../../modules/seo/tenant-scope"

import { resolveStoreIdFromPublishableKey } from "./resolve-store-id-from-publishable-key"

const STORE_ID_HEADER = "x-store-id"

function isDevOrTestEnv(): boolean {
  const env = process.env.NODE_ENV?.trim().toLowerCase()
  return env === "development" || env === "test"
}

function readClientStoreIdHint(req: MedusaRequest): string | null {
  const query = (req.query ?? {}) as { store_id?: string }
  if (typeof query.store_id === "string" && query.store_id.trim().length > 0) {
    return query.store_id.trim()
  }
  const header = req.headers[STORE_ID_HEADER]
  const headerValue = Array.isArray(header) ? header[0] : header
  if (typeof headerValue === "string" && headerValue.trim().length > 0) {
    return headerValue.trim()
  }
  return null
}

function assertClientStoreIdMatches(boundStoreId: string, clientHint: string | null): void {
  if (!clientHint) {
    return
  }
  assertMedusaStoreId(clientHint)
  if (clientHint !== boundStoreId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "store_id does not match the request tenant"
    )
  }
}

/**
 * Resolves tenant store id for MercFlow store SEO routes.
 * Authoritative: publishable API key → store, and/or Host → storefront_url (T008).
 * Client `store_id` / `X-Store-Id` must match when provided; mismatches are rejected.
 */
export async function resolveStoreSeoStoreId(
  req: MedusaRequest,
  lookup: StorefrontUrlLookup
): Promise<string> {
  const [fromPublishable, fromHost] = await Promise.all([
    resolveStoreIdFromPublishableKey(req),
    resolveStoreIdFromHost({
      hostHeader: typeof req.headers.host === "string" ? req.headers.host : undefined,
      storeIdHeader: undefined,
      lookup,
    }),
  ])

  if (fromPublishable && fromHost && fromPublishable !== fromHost) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Publishable API key store does not match host tenant"
    )
  }

  let boundStoreId = fromPublishable ?? fromHost

  if (!boundStoreId && isDevOrTestEnv()) {
    const envDefault = process.env.MERCFLOW_DEFAULT_STORE_ID?.trim()
    if (envDefault) {
      assertMedusaStoreId(envDefault)
      boundStoreId = envDefault
    }
  }

  if (!boundStoreId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Could not resolve store tenant (publishable API key or host mapping required)"
    )
  }

  assertClientStoreIdMatches(boundStoreId, readClientStoreIdHint(req))
  return boundStoreId
}
