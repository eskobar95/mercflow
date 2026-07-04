import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntity } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../http/zod-error"
import { mapResolvedToReadPayload } from "../../http/product-content-read-payload"
import { resolveProductStoreId } from "../../http/resolve-entity-store-id"
import { CONTENT_MODULE } from "../../../modules/content"
import {
  adminProductContentPostBodySchema,
  localeQuerySchema,
} from "../../../modules/content/http-schemas"
import type ContentModuleService from "../../../modules/content/service"

/**
 * POST /admin/product-content
 * Creates or updates CMS content for a product locale (matches `UpsertProductContentInput`).
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const query = localeQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(query.error)
  }
  const locale = query.data.locale

  const parsed = adminProductContentPostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const { product_id: productId, ...body } = parsed.data

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
  const storeId = await resolveProductStoreId(req, productId)
  const resolved = await contentService.upsertProductContent(productId, locale, body, storeId)

  const productStatusRaw = (product as { status?: string }).status
  const productStatus =
    typeof productStatusRaw === "string" && productStatusRaw.length > 0
      ? productStatusRaw
      : "unknown"

  const payload = await mapResolvedToReadPayload(req.scope, resolved, productStatus)
  res.status(200).json(payload)
}
