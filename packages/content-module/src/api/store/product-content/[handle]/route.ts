import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IProductModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../http/zod-error"
import { mapResolvedToReadPayload } from "../../../http/product-content-read-payload"
import { CONTENT_MODULE } from "../../../../modules/content"
import { localeQuerySchema } from "../../../../modules/content/http-schemas"
import type ContentModuleService from "../../../../modules/content/service"

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

  const productModule = req.scope.resolve(Modules.PRODUCT) as IProductModuleService
  const products = await productModule.listProducts({ handle: handleRaw }, { take: 2 })
  const product = products[0]
  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product "${handleRaw}" not found`)
  }

  const productStatus = product.status ?? "unknown"
  if (productStatus !== "published") {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product "${handleRaw}" not found`)
  }

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService

  const resolved = await contentService.findByProductId(product.id, locale)
  if (!resolved) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product content not found")
  }

  const payload = await mapResolvedToReadPayload(req.scope, resolved, productStatus)
  res.status(200).json(payload)
}
