import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntity } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { mapResolvedCategoryToReadPayload } from "../../../http/category-content-read-payload"
import { sendZodError } from "../../../http/zod-error"
import { CONTENT_MODULE } from "../../../../modules/content"
import { localeQuerySchema } from "../../../../modules/content/http-schemas"
import type ContentModuleService from "../../../../modules/content/service"

/**
 * GET /admin/category-content/:id
 *
 * `:id` is the Medusa **product_category id**.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const categoryId = req.params.id
  if (!categoryId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing category id")
  }

  const query = localeQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(res, query.error)
    return
  }
  const locale = query.data.locale

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
  const resolved = await contentService.findByCategoryId(categoryId, locale)
  if (!resolved) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Category content not found")
  }

  const payload = await mapResolvedCategoryToReadPayload(
    req.scope,
    resolved,
    catalogVisibilityStatus
  )
  res.status(200).json(payload)
}
