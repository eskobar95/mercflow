import {
  resolveStoreIdFromHost as resolveFromSeo,
  type StorefrontUrlLookup,
} from "@mercflow/seo-module/mercflow-tenant-resolver"

import type FeedConfigService from "./service" // used only as deprecated param type

export type ResolveStoreIdFromHostInput = {
  hostHeader: string | undefined
  storeIdHeader: string | undefined
  /** @deprecated Ignored — Host→store uses mercflow_seo_config (T008). */
  feedConfigService: FeedConfigService
  lookup?: StorefrontUrlLookup
}

/**
 * Resolves tenant from Host via seo-module (mercflow_seo_config.storefront_url).
 * Pass `lookup` in tests; production routes use mercflowPublicTenantMiddleware.
 */
export async function resolveStoreIdFromHost(
  input: ResolveStoreIdFromHostInput
): Promise<string | null> {
  if (!input.lookup) {
    return null
  }
  return resolveFromSeo({
    hostHeader: input.hostHeader,
    storeIdHeader: input.storeIdHeader,
    lookup: input.lookup,
  })
}

export { assertResolvedStoreId } from "@mercflow/seo-module/mercflow-tenant-resolver"
