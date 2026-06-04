import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../http/zod-error"
import { CONTENT_MODULE } from "../../../../modules/content"
import { localeQuerySchema } from "../../../../modules/content/http-schemas"
import type ContentModuleService from "../../../../modules/content/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const slugRaw = req.params.slug
  if (!slugRaw) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing slug")
  }

  const query = localeQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(res, query.error)
    return
  }
  const locale = query.data.locale

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const payload = await contentService.findPublishedPageForStorefront(slugRaw, locale)
  if (!payload) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Page not found")
  }

  res.status(200).json(payload)
}
