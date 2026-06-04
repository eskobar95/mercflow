import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../http/zod-error"
import { resolveAdminStoreId } from "../../http/resolve-admin-store-id"
import { SEO_MODULE } from "../../../modules/seo"
import { robotsConfigBodySchema } from "../../../modules/seo/http-schemas"
import { renderRobotsTxt } from "../../../modules/seo/robots-service"
import type SeoModuleService from "../../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const seoConfig = await seoService.getSeoConfig(storeId)
  const robotsConfig = await seoService.getOrCreateRobotsConfig(storeId)
  const preview = renderRobotsTxt(robotsConfig, seoConfig?.storefront_url ?? null)
  res.status(200).json({ robots_config: robotsConfig, preview })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  const body = robotsConfigBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(res, body.error)
    return
  }
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const seoConfig = await seoService.getSeoConfig(storeId)
  const robotsConfig = await seoService.upsertRobotsConfig(storeId, body.data)
  const preview = renderRobotsTxt(robotsConfig, seoConfig?.storefront_url ?? null)
  res.status(200).json({ robots_config: robotsConfig, preview })
}
