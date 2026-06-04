import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import {
  invalidateAllSitemapCaches,
  invalidateSitemapCache,
} from "@mercflow/seo-module/mercflow-sitemap-cache"

type SitemapInvalidationPayload = {
  store_id?: string
}

async function mercflowSitemapCacheInvalidationHandler(
  args: SubscriberArgs<SitemapInvalidationPayload>
): Promise<void> {
  const storeId = args.event.data?.store_id
  if (typeof storeId === "string" && storeId.length > 0) {
    invalidateSitemapCache(storeId)
    return
  }
  invalidateAllSitemapCaches()
}

export default mercflowSitemapCacheInvalidationHandler

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product_category.created",
    "product_category.updated",
    "product_category.deleted",
    "mercflow.page.changed",
  ],
}
