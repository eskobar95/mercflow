import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"
import { z } from "zod"

import type { MercflowTenantRequest } from "../../../integrations/mercflow-feed-tenant-middleware"
import { loadProductContentForFeed } from "../../../modules/feed/content-loader"
import {
  createFeedGeneratorFromScope,
  FeedGeneratorService,
} from "../../../modules/feed/feed-generator-service"
import { getCachedFeedXml, setCachedFeedXml } from "../../../modules/feed/feed-cache"
import { loadBrandNameForProduct } from "../../../modules/feed/loaders"
import { FEED_MODULE } from "../../../modules/feed"
import type FeedConfigService from "../../../modules/feed/service"

const localeQuerySchema = z.object({
  locale: z.string().min(1).optional(),
})

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const tenantReq = req as MercflowTenantRequest
  const storeId = tenantReq.mercflowStoreId
  if (!storeId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "No tenant found for this host")
  }

  const query = localeQuerySchema.safeParse(req.query)
  if (!query.success) {
    res.status(400).json({ message: "Invalid locale query parameter" })
    return
  }
  const locale = query.data.locale ?? "en"

  let xml = getCachedFeedXml(storeId)
  if (!xml) {
    const feedConfigService = req.scope.resolve(FEED_MODULE) as FeedConfigService
    const generator: FeedGeneratorService = createFeedGeneratorFromScope(
      req.scope,
      feedConfigService,
      (_sid, productId, loc) => loadProductContentForFeed(req.scope, productId, loc),
      (sid, productId) => loadBrandNameForProduct(feedConfigService, sid, productId)
    )
    xml = await generator.generate(storeId, locale)
    setCachedFeedXml(storeId, xml)
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.status(200).send(xml)
}
