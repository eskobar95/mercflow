import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { invalidateAllFeedCaches } from "@mercflow/feed-module/mercflow-feed-cache"

async function mercflowFeedCacheInvalidationHandler(
  _args: SubscriberArgs<Record<string, unknown>>
): Promise<void> {
  invalidateAllFeedCaches()
}

export default mercflowFeedCacheInvalidationHandler

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
