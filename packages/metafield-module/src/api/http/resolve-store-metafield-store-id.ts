import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { assertMedusaStoreId } from "../../modules/metafield/tenant-scope"

import { resolveStoreIdFromPublishableKey } from "./resolve-store-id-from-publishable-key"

function isDevOrTestEnv(): boolean {
  const env = process.env.NODE_ENV?.trim().toLowerCase()
  return env === "development" || env === "test"
}

/**
 * Resolves tenant store id for MercFlow store metafield routes.
 * Authoritative: publishable API key → store.
 */
export async function resolveStoreMetafieldStoreId(req: MedusaRequest): Promise<string> {
  const fromPublishable = await resolveStoreIdFromPublishableKey(req)

  if (fromPublishable) {
    return fromPublishable
  }

  if (isDevOrTestEnv()) {
    const envDefault = process.env.MERCFLOW_DEFAULT_STORE_ID?.trim()
    if (envDefault !== undefined && envDefault !== "") {
      assertMedusaStoreId(envDefault)
      return envDefault
    }
  }

  throw new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    "Publishable API key required"
  )
}
