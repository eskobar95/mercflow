import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntity } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../../http/zod-error"
import { CONTENT_MODULE } from "../../../../../modules/content"
import type ContentModuleService from "../../../../../modules/content/service"
import {
  localeQuerySchema,
  productContentBodySchema,
} from "../../../../../modules/content/http-schemas"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const productId = req.params.id
  if (!productId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing product id")
  }

  const query = localeQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(query.error)
  }
  const locale = query.data.locale

  const product = await refetchEntity({
    entity: "product",
    idOrFilter: productId,
    scope: req.scope,
    fields: ["id"],
  })
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id "${productId}" not found`
    )
  }

  const contentService = req.scope.resolve(
    CONTENT_MODULE
  ) as ContentModuleService
  const content = await contentService.retrieveProductContentForLocale(
    productId,
    locale
  )
  res.status(200).json({ content })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const productId = req.params.id
  if (!productId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing product id")
  }

  const query = localeQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(query.error)
  }
  const locale = query.data.locale

  const body = productContentBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(body.error)
  }

  const product = await refetchEntity({
    entity: "product",
    idOrFilter: productId,
    scope: req.scope,
    fields: ["id"],
  })
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id "${productId}" not found`
    )
  }

  const contentService = req.scope.resolve(
    CONTENT_MODULE
  ) as ContentModuleService
  const content = await contentService.upsertProductContent(
    productId,
    locale,
    body.data
  )
  res.status(200).json({ content })
}
