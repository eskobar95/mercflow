import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { resolveStoreSeoTenant } from "../../../resolve-store-seo-tenant"
import { SEO_MODULE } from "../../../../../../modules/seo"
import { buildCategoryJsonLd } from "../../../../../../modules/seo/json-ld-service"
import {
  loadCategoryBreadcrumbs,
  loadCategoryForMetadata,
} from "../../../../../../modules/seo/metadata-catalog"
import type SeoModuleService from "../../../../../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const categoryId = req.params.id
  if (!categoryId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing category id")
  }

  const storeId = await resolveStoreSeoTenant(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const seoConfig = await seoService.getOrCreateSeoConfig(storeId)

  if (!seoConfig.storefront_url) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "JSON-LD is not configured for this store (missing storefront_url)"
    )
  }

  await loadCategoryForMetadata(req.scope, storeId, categoryId)
  const breadcrumbs = await loadCategoryBreadcrumbs(
    req.scope,
    storeId,
    categoryId,
    seoConfig.storefront_url
  )

  const jsonLd = buildCategoryJsonLd({
    storefrontUrl: seoConfig.storefront_url,
    breadcrumbs,
    settings: seoConfig.json_ld_settings,
  })

  res.status(200).json({ json_ld: jsonLd })
}
