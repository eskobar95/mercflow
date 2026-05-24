import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntity } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../http/zod-error"
import { mapResolvedToReadPayload } from "../../../http/product-content-read-payload"
import { CONTENT_MODULE } from "../../../../modules/content"
import { localeQuerySchema } from "../../../../modules/content/http-schemas"
import type ContentModuleService from "../../../../modules/content/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const productId = req.params.product_id
  if (!productId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing product id")
  }

  const query = localeQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(res, query.error)
    return
  }
  const locale = query.data.locale

  const product = await refetchEntity({
    entity: "product",
    idOrFilter: productId,
    scope: req.scope,
    fields: ["id", "status"],
  })
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id "${productId}" not found`
    )
  }

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const resolved = await contentService.findByProductId(productId, locale)
  if (!resolved) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product content not found")
  }

  const productStatusRaw = (product as { status?: string }).status
  const productStatus =
    typeof productStatusRaw === "string" && productStatusRaw.length > 0
      ? productStatusRaw
      : "unknown"

  const payload = await mapResolvedToReadPayload(req.scope, resolved, productStatus)
  res.status(200).json(payload)
}
