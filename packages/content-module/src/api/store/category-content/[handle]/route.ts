import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { mapResolvedCategoryToReadPayload } from "../../../http/category-content-read-payload"
import { sendZodError } from "../../../http/zod-error"
import { CONTENT_MODULE } from "../../../../modules/content"
import { localeQuerySchema } from "../../../../modules/content/http-schemas"
import type ContentModuleService from "../../../../modules/content/service"

type ProductModuleWithCategories = IProductModuleService & {
  listProductCategories(
    filters: { handle: string },
    config: { take: number }
  ): Promise<Array<{ id: string; is_active?: boolean; is_internal?: boolean }>>
}

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const handleRaw = req.params.handle
  if (!handleRaw) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing handle")
  }

  const query = localeQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(query.error)
  }
  const locale = query.data.locale

  const productModule = req.scope.resolve(
    Modules.PRODUCT
  ) as ProductModuleWithCategories
  const categories = await productModule.listProductCategories({ handle: handleRaw }, { take: 2 })
  const category = categories[0]
  if (!category) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Category "${handleRaw}" not found`)
  }

  const isListed =
    typeof category.is_active === "boolean" &&
    category.is_active &&
    !(typeof category.is_internal === "boolean" && category.is_internal)
  if (!isListed) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Category "${handleRaw}" not found`)
  }

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService

  const resolved = await contentService.findByCategoryId(category.id, locale)
  if (!resolved) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Category content not found")
  }
  if (resolved.cms_status !== "published") {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Category content not found")
  }

  const payload = await mapResolvedCategoryToReadPayload(req.scope, resolved, "published")
  res.status(200).json(payload)
}
