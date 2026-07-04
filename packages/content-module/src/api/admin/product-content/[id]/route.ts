import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchEntity } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { sendZodError } from "../../../http/zod-error"
import { mapResolvedToReadPayload } from "../../../http/product-content-read-payload"
import { resolveProductStoreId } from "../../../http/resolve-entity-store-id"
import { CONTENT_MODULE } from "../../../../modules/content"
import {
  localeQuerySchema,
  productContentBodySchema,
} from "../../../../modules/content/http-schemas"
import type ContentModuleService from "../../../../modules/content/service"

/**
 * GET /admin/product-content/:id
 * `id` is the Medusa **product id** (same as MercFlow CMS read slice).
 *
 * PATCH /admin/product-content/:id
 * `id` must be the `product_content` row id (MercFlow mutation slice).
 *
 * Segment names differ by HTTP method — consumers must avoid passing a non-product id on GET,
 * otherwise the request returns 404.
 */
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
  const resolved = await contentService.findByProductId(productId, locale, storeId)
  if (!resolved) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product content not found")
  }

  const productStatusRaw = (product as { status?: string }).status
  const productStatus =
    typeof productStatusRaw === "string" && productStatusRaw.length > 0
      ? productStatusRaw
      : "unknown"

  const payload = await mapResolvedToReadPayload(req.scope, resolved, productStatus)
  res.setHeader("Cache-Control", "no-store")
  res.status(200).json(payload)
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const contentRowId = req.params.id
  if (!contentRowId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing product content id")
  }

  const body = productContentBodySchema.safeParse(req.body ?? {})
  if (!body.success) {
    sendZodError(body.error)
  }

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService

  const rows = await contentService.listProductContents({ id: contentRowId })
  const row = rows[0]
  if (!row) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product content with id "${contentRowId}" not found`
    )
  }

  const rowStoreId = (row as { store_id?: string }).store_id
  const storeId =
    typeof rowStoreId === "string" && rowStoreId.length > 0
      ? rowStoreId
      : await resolveProductStoreId(req, row.product_id)

  const resolved = await contentService.upsertProductContent(
    row.product_id,
    row.locale,
    body.data,
    storeId
  )

  const product = await refetchEntity({
    entity: "product",
    idOrFilter: row.product_id,
    scope: req.scope,
    fields: ["id", "status"],
  })
  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product "${row.product_id}" not found`)
  }

  const productStatusRaw = (product as { status?: string }).status
  const productStatus =
    typeof productStatusRaw === "string" && productStatusRaw.length > 0
      ? productStatusRaw
      : "unknown"

  const payload = await mapResolvedToReadPayload(req.scope, resolved, productStatus)
  res.setHeader("Cache-Control", "no-store")
  res.status(200).json(payload)
}
