import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import type { MercflowTenantRequest } from "../../integrations/mercflow-public-tenant-middleware"
import { SEO_MODULE } from "../../modules/seo"
import {
  createSitemapGeneratorFromScope,
} from "../../modules/seo/sitemap-service"
import {
  getCachedSitemapXml,
  setCachedSitemapXml,
} from "../../modules/seo/sitemap-cache"
import type SeoModuleService from "../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const tenantReq = req as MercflowTenantRequest
  const storeId = tenantReq.mercflowStoreId
  if (!storeId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "No tenant found for this host")
  }

  let xml = getCachedSitemapXml(storeId)
  if (!xml) {
    const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
    const generator = createSitemapGeneratorFromScope(req.scope, seoService)
    xml = await generator.generate(storeId)
    setCachedSitemapXml(storeId, xml)
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.status(200).send(xml)
}
