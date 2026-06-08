import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { resolveStoreSeoTenant } from "../../../resolve-store-seo-tenant"
import { sendZodError } from "../../../../../http/zod-error"
import { SEO_MODULE } from "../../../../../../modules/seo"
import { buildProductJsonLd } from "../../../../../../modules/seo/json-ld-service"
import {
  loadProductContentFields,
  loadProductForMetadata,
  productPageUrl,
} from "../../../../../../modules/seo/metadata-catalog"
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
      "JSON-LD is not configured for this store (missing storefront_url)"
    )
  }

  const [product, content] = await Promise.all([
    loadProductForMetadata(req.scope, storeId, productId),
    loadProductContentFields(req.scope, storeId, productId, query.data.locale),
  ])

  const pageUrl = productPageUrl(seoConfig.storefront_url, product.handle)
  const description =
    content.seo_description?.trim() ||
    product.description?.trim() ||
    null

  const jsonLd = buildProductJsonLd({
    storefrontUrl: seoConfig.storefront_url,
    productUrl: pageUrl,
    name: content.seo_title?.trim() || product.title,
    description,
    imageUrl: content.image_url ?? product.thumbnail,
    sku: product.sku,
    price: product.price,
    currency: product.currency,
    availability: product.availability,
    settings: seoConfig.json_ld_settings,
  })

  res.status(200).json({ json_ld: jsonLd })
}
