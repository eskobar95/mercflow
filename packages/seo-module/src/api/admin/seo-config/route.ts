import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../http/zod-error"
import { resolveAdminStoreId } from "../../http/resolve-admin-store-id"
import { SEO_MODULE } from "../../../modules/seo"
import { seoConfigBodySchema } from "../../../modules/seo/http-schemas"
import type SeoModuleService from "../../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const config = await seoService.getOrCreateSeoConfig(storeId)
  res.status(200).json({ seo_config: config })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveAdminStoreId(req)
  const body = seoConfigBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(res, body.error)
    return
  }
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const config = await seoService.upsertSeoConfig(storeId, body.data)
  res.status(200).json({ seo_config: config })
}
