import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntity } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../../http/zod-error"
import { CONTENT_MODULE } from "../../../../../modules/content"
import type ContentModuleService from "../../../../../modules/content/service"
import {
  categoryContentBodySchema,
  localeQuerySchema,
} from "../../../../../modules/content/http-schemas"

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
    fields: ["id"],
  })
  if (!category) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product category with id "${categoryId}" not found`
    )
  }

  const contentService = req.scope.resolve(
    CONTENT_MODULE
  ) as ContentModuleService
  const content = await contentService.retrieveCategoryContentForLocale(
    categoryId,
    locale
  )
  res.status(200).json({ content })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
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

  const body = categoryContentBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(res, body.error)
    return
  }

  const category = await refetchEntity({
    entity: "product_category",
    idOrFilter: categoryId,
    scope: req.scope,
    fields: ["id"],
  })
  if (!category) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product category with id "${categoryId}" not found`
    )
  }

  const contentService = req.scope.resolve(
    CONTENT_MODULE
  ) as ContentModuleService
  const content = await contentService.upsertCategoryContent(
    categoryId,
    locale,
    body.data
  )
  res.status(200).json({ content })
}
