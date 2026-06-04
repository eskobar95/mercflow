import type { MedusaRequest } from "@medusajs/framework/http"

import { resolveStoreSeoStoreId } from "../../http/resolve-store-seo-store-id"
import { SEO_MODULE } from "../../../modules/seo"
import type SeoModuleService from "../../../modules/seo/service"

export async function resolveStoreSeoTenant(req: MedusaRequest): Promise<string> {
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  return resolveStoreSeoStoreId(req, {
    getStorefrontUrl: async (storeId: string): Promise<string | null> => {
      const config = await seoService.getSeoConfig(storeId)
      return config?.storefront_url ?? null
    },
  })
}
