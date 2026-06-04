import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { resolveAdminStoreId } from "../../../http/resolve-admin-store-id"
import { SEO_MODULE } from "../../../../modules/seo"
import { createSitemapGeneratorFromScope } from "../../../../modules/seo/sitemap-service"
import type SeoModuleService from "../../../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const generator = createSitemapGeneratorFromScope(req.scope, seoService)
  const xml = await generator.generate(storeId)
  res.status(200).json({ xml })
}
