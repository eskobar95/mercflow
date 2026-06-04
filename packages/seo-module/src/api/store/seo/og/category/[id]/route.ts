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
  categoryPublicUrl,
} from "../../../../../../modules/seo/json-ld-service"
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
    sendZodError(res, query.error)
    return
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

  const [category, content] = await Promise.all([
    loadCategoryForMetadata(req.scope, storeId, categoryId),
    loadCategoryContentFields(req.scope, storeId, categoryId, query.data.locale),
  ])

  const pageUrl = categoryPublicUrl(seoConfig.storefront_url, category.handle)
  const title = resolveOgTitle(content.seo_title, category.name)
  const description = resolveOgDescription(content.seo_description, category.description)

  const meta = buildOgMetaTags({
    pageUrl,
    title,
    description,
    imageUrl: content.image_url,
    type: "website",
  })

  res.status(200).json({ og: meta })
}
