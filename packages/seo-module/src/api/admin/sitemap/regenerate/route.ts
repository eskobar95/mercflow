import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { resolveAdminStoreId } from "../../../http/resolve-admin-store-id"
import { SEO_MODULE } from "../../../../modules/seo"
import {
  getSitemapCacheUpdatedAt,
  invalidateSitemapCache,
  setCachedSitemapXml,
} from "../../../../modules/seo/sitemap-cache"
import {
  createSitemapGeneratorFromScope,
} from "../../../../modules/seo/sitemap-service"
import type SeoModuleService from "../../../../modules/seo/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  invalidateSitemapCache(storeId)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const generator = createSitemapGeneratorFromScope(req.scope, seoService)
  const xml = await generator.generate(storeId)
  setCachedSitemapXml(storeId, xml)
  res.status(200).json({
    regenerated_at: getSitemapCacheUpdatedAt(storeId) ?? new Date().toISOString(),
    byte_length: xml.length,
  })
}
