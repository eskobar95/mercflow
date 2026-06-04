import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { resolveStoreSeoTenant } from "../../resolve-store-seo-tenant"
import { SEO_MODULE } from "../../../../../modules/seo"
import { buildGlobalJsonLd } from "../../../../../modules/seo/json-ld-service"
import type SeoModuleService from "../../../../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = await resolveStoreSeoTenant(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const seoConfig = await seoService.getOrCreateSeoConfig(storeId)

  if (!seoConfig.storefront_url) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "JSON-LD is not configured for this store (missing storefront_url)"
    )
  }

  const jsonLd = buildGlobalJsonLd({
    storefrontUrl: seoConfig.storefront_url,
    orgName: seoConfig.org_name,
    orgLogoUrl: seoConfig.org_logo_url,
    orgSocialUrls: seoConfig.org_social_urls,
    settings: seoConfig.json_ld_settings,
  })

  res.status(200).json({ json_ld: jsonLd })
}
