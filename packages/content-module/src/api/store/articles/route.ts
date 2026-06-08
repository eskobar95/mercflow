import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendZodError } from "../../http/zod-error"
import { CONTENT_MODULE } from "../../../modules/content"
import { localeQuerySchema } from "../../../modules/content/http-schemas"
import type ContentModuleService from "../../../modules/content/service"
import {
  articleRecordToStoreListJson,
} from "../../http/article-json"

/**
 * GET /store/articles — published articles only.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const query = localeQuerySchema.safeParse(req.query ?? {})
  if (!query.success) {
    sendZodError(query.error)
  }

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const rows = await contentService.listPublishedArticles(query.data.locale)
  res.status(200).json({
    articles: rows.map((row) => articleRecordToStoreListJson(row)),
  })
}
