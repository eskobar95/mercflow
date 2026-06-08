import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../http/zod-error"
import { resolveAdminStoreId } from "../../http/resolve-admin-store-id"
import { SEO_MODULE } from "../../../modules/seo"
import { seoConfigBodySchema } from "../../../modules/seo/http-schemas"
import { parseJsonLdSettings } from "../../../modules/seo/json-ld-settings"
import { clearAllTenantResolverCaches } from "../../../modules/seo/tenant-resolver-cache"
import type SeoModuleService from "../../../modules/seo/service"
import type { UpsertSeoConfigInput } from "../../../modules/seo/types"

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
    sendZodError(body.error)
  }
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const payload: UpsertSeoConfigInput = {
    ...(body.data.storefront_url !== undefined
      ? { storefront_url: body.data.storefront_url }
      : {}),
    ...(body.data.slug_strategy !== undefined
      ? { slug_strategy: body.data.slug_strategy }
      : {}),
    ...(body.data.org_name !== undefined ? { org_name: body.data.org_name } : {}),
    ...(body.data.org_logo_url !== undefined
      ? { org_logo_url: body.data.org_logo_url }
      : {}),
    ...(body.data.org_social_urls !== undefined
      ? { org_social_urls: body.data.org_social_urls }
      : {}),
    ...(body.data.json_ld_settings !== undefined
      ? { json_ld_settings: parseJsonLdSettings(body.data.json_ld_settings) }
      : {}),
  }
  const config = await seoService.upsertSeoConfig(storeId, payload)
  if (body.data.storefront_url !== undefined) {
    clearAllTenantResolverCaches()
  }
  res.status(200).json({ seo_config: config })
}
