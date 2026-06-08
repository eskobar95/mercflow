import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { resolveStoreSeoTenant } from "../../../resolve-store-seo-tenant"
import { sendZodError } from "../../../../../http/zod-error"
import { buildCategoryCanonical } from "../../../../../../modules/seo/canonical-service"
import {
  loadCategoryContentFields,
  loadCategoryForMetadata,
} from "../../../../../../modules/seo/metadata-catalog"
import { SEO_MODULE } from "../../../../../../modules/seo"
import { seoLocaleQuerySchema } from "../../../locale-query"
import type SeoModuleService from "../../../../../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const categoryId = req.params.id
  if (!categoryId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing category id")
  }

  const query = seoLocaleQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(query.error)
  }

  const storeId = await resolveStoreSeoTenant(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const seoConfig = await seoService.getOrCreateSeoConfig(storeId)

  const [category, content] = await Promise.all([
    loadCategoryForMetadata(req.scope, storeId, categoryId),
    loadCategoryContentFields(req.scope, storeId, categoryId, query.data.locale),
  ])

  const canonical = buildCategoryCanonical({
    storefrontUrl: seoConfig.storefront_url,
    handle: category.handle,
    override: content.canonical_url_override,
  })

  res.status(200).json({ canonical })
}
