import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { FEED_MODULE } from "../modules/feed"
import type FeedConfigService from "../modules/feed/service"
import { resolveStoreIdFromHost } from "../modules/feed/tenant-resolver"

export type MercflowTenantRequest = MedusaRequest & {
  mercflowStoreId?: string
}

/**
 * Resolves tenant from Host (and optional X-Store-Id) for `/feed/*` routes. Fail closed → 404.
 */
export async function mercflowFeedTenantMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  const feedConfigService = req.scope.resolve(FEED_MODULE) as FeedConfigService
  const hostHeader = typeof req.headers.host === "string" ? req.headers.host : undefined
  const storeIdHeader =
    typeof req.headers["x-store-id"] === "string" ? req.headers["x-store-id"] : undefined

  const storeId = await resolveStoreIdFromHost({
    hostHeader,
    storeIdHeader,
    feedConfigService,
  })

  if (!storeId) {
    res.status(404).json({ message: "Not found" })
    return
  }

  ;(req as MercflowTenantRequest).mercflowStoreId = storeId
  next()
}
