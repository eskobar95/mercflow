import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntity } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { mapResolvedCategoryToReadPayload } from "../../http/category-content-read-payload"
import { sendZodError } from "../../http/zod-error"
import { CONTENT_MODULE } from "../../../modules/content"
import {
  categoryContentPostBodySchema,
  localeQuerySchema,
} from "../../../modules/content/http-schemas"
import type ContentModuleService from "../../../modules/content/service"

/**
 * POST /admin/category-content
 *
 * Upserts CMS content for (`category_id`, `locale` query). Matches MercFlow flat category CMS
 * payloads via `mapResolvedCategoryToReadPayload`.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const query = localeQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(res, query.error)
    return
  }
  const locale = query.data.locale

  const parsed = categoryContentPostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const { category_id: categoryId, ...body } = parsed.data

  const category = await refetchEntity({
    entity: "product_category",
    idOrFilter: categoryId,
    scope: req.scope,
    fields: ["id", "is_active", "is_internal"],
  })
  if (!category) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product category with id "${categoryId}" not found`
    )
  }

  const ref = category as { is_active?: boolean; is_internal?: boolean }
  const isListed =
    typeof ref.is_active === "boolean" &&
    ref.is_active &&
    !(typeof ref.is_internal === "boolean" && ref.is_internal)
  const catalogVisibilityStatus = isListed ? "published" : "draft"

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const resolved = await contentService.upsertCategoryContent(categoryId, locale, body)

  const payload = await mapResolvedCategoryToReadPayload(
    req.scope,
    resolved,
    catalogVisibilityStatus
  )
  res.status(200).json(payload)
}
