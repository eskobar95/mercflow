import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../http/zod-error"
import { CONTENT_MODULE } from "../../../../modules/content"
import { localeQuerySchema } from "../../../../modules/content/http-schemas"
import type ContentModuleService from "../../../../modules/content/service"
import { articleRecordToStoreDetailJson } from "../../../http/article-json"

/**
 * GET /store/articles/:slug — single published article by slug + locale.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const slugRaw = req.params.slug
  if (!slugRaw) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing slug")
  }

  const query = localeQuerySchema.safeParse(req.query ?? {})
  if (!query.success) {
    sendZodError(query.error)
  }

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const row = await contentService.findPublishedArticleBySlug(slugRaw, query.data.locale)
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Article not found")
  }

  res.status(200).json({ article: articleRecordToStoreDetailJson(row) })
}
