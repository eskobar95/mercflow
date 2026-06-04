import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { resolveStoreSeoTenant } from "../../../resolve-store-seo-tenant"
import { sendZodError } from "../../../../../http/zod-error"
import { buildProductCanonical } from "../../../../../../modules/seo/canonical-service"
import {
  loadProductContentFields,
  loadProductForMetadata,
} from "../../../../../../modules/seo/metadata-catalog"
import { SEO_MODULE } from "../../../../../../modules/seo"
import { seoLocaleQuerySchema } from "../../../locale-query"
import type SeoModuleService from "../../../../../../modules/seo/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const productId = req.params.id
  if (!productId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing product id")
  }

  const query = seoLocaleQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(res, query.error)
    return
  }

  const storeId = await resolveStoreSeoTenant(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const seoConfig = await seoService.getOrCreateSeoConfig(storeId)

  const [product, content] = await Promise.all([
    loadProductForMetadata(req.scope, storeId, productId),
    loadProductContentFields(req.scope, storeId, productId, query.data.locale),
  ])

  const canonical = buildProductCanonical({
    storefrontUrl: seoConfig.storefront_url,
    handle: product.handle,
    override: content.canonical_url_override,
  })

  res.status(200).json({ canonical })
}
