import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import type { MercflowTenantRequest } from "../../integrations/mercflow-public-tenant-middleware"
import { SEO_MODULE } from "../../modules/seo"
import { renderRobotsTxt } from "../../modules/seo/robots-service"
import type SeoModuleService from "../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const tenantReq = req as MercflowTenantRequest
  const storeId = tenantReq.mercflowStoreId
  if (!storeId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "No tenant found for this host")
  }

  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const seoConfig = await seoService.getSeoConfig(storeId)
  const robotsConfig = await seoService.getOrCreateRobotsConfig(storeId)
  const body = renderRobotsTxt(robotsConfig, seoConfig?.storefront_url ?? null)

  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.status(200).send(body)
}
