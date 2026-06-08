import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { resolveSentryStoreId } from "./resolve-sentry-store-id"
import { setSentryStoreIdTag } from "./sentry"

export async function sentryStoreIdMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): Promise<void> {
  const storeId = await resolveSentryStoreId(req)
  if (storeId) setSentryStoreIdTag(storeId)
  next()
}
