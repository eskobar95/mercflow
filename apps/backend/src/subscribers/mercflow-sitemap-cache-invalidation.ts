import type { SubscriberConfig } from "@medusajs/framework"

import { invalidateAllSitemapCaches } from "@mercflow/seo-module/mercflow-sitemap-cache"

async function mercflowSitemapCacheInvalidationHandler(): Promise<void> {
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
  ],
}
