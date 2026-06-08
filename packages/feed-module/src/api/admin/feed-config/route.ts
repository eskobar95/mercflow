import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../http/zod-error"
import { resolveAdminStoreId } from "../../http/resolve-admin-store-id"
import { buildFeedAdminOverview } from "../../../modules/feed/feed-admin-overview"
import { invalidateFeedCache } from "../../../modules/feed/feed-cache"
import { feedConfigPutBodySchema } from "../../../modules/feed/http-schemas"
import { FEED_MODULE } from "../../../modules/feed"
import type FeedConfigService from "../../../modules/feed/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  const feedConfigService = req.scope.resolve(FEED_MODULE) as FeedConfigService
  const config = await feedConfigService.get(storeId)
  const overview = await buildFeedAdminOverview({
    scope: req.scope,
    storeId,
    config,
  })

  res.status(200).json({
    feed_config: config,
    overview,
  })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  const body = feedConfigPutBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(body.error)
  }

  const feedConfigService = req.scope.resolve(FEED_MODULE) as FeedConfigService
  const config = await feedConfigService.update(storeId, body.data)
  invalidateFeedCache(storeId)

  const overview = await buildFeedAdminOverview({
    scope: req.scope,
    storeId,
    config,
  })

  res.status(200).json({
    feed_config: config,
    overview,
  })
}
