import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { resolveStoreSeoTenant } from "../../../resolve-store-seo-tenant"
import { sendZodError } from "../../../../../http/zod-error"
import {
  buildOgMetaTags,
  resolveOgDescription,
  resolveOgTitle,
} from "../../../../../../modules/seo/og-meta-service"
import {
  loadProductContentFields,
  loadProductForMetadata,
  productPageUrl,
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
    sendZodError(query.error)
  }

  const storeId = await resolveStoreSeoTenant(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const seoConfig = await seoService.getOrCreateSeoConfig(storeId)

  if (!seoConfig.storefront_url) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "OG metadata is not configured for this store (missing storefront_url)"
    )
  }

  const [product, content] = await Promise.all([
    loadProductForMetadata(req.scope, storeId, productId),
    loadProductContentFields(req.scope, storeId, productId, query.data.locale),
  ])

  const pageUrl = productPageUrl(seoConfig.storefront_url, product.handle)
  const title = resolveOgTitle(content.seo_title, product.title)
  const description = resolveOgDescription(content.seo_description, product.description)

  const meta = buildOgMetaTags({
    pageUrl,
    title,
    description,
    imageUrl: content.image_url ?? product.thumbnail,
    type: "product",
  })

  res.status(200).json({ og: meta })
}
