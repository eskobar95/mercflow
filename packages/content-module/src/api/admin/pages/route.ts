import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { emitMercflowPageChanged } from "../../http/emit-mercflow-page-changed"
import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import { resolveAdminStoreId } from "../../http/resolve-admin-store-id"
import { sendZodError } from "../../http/zod-error"
import { CONTENT_MODULE } from "../../../modules/content"
import {
  adminPageCreateBodySchema,
  adminPagesListQuerySchema,
} from "../../../modules/content/http-schemas"
import type ContentModuleService from "../../../modules/content/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const query = adminPagesListQuerySchema.safeParse(req.query)
  if (!query.success) {
    sendZodError(query.error)
  }

  const limit = Math.min(resolveAdminListLimit(query.data.limit), 100)
  const offset = resolveAdminListOffset(query.data.offset)

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const result = await contentService.adminListPages({
    locale: query.data.locale,
    limit,
    offset,
  })

  res.status(200).json({
    pages: result.pages,
    count: result.count,
    limit,
    offset,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = adminPageCreateBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveAdminStoreId(req)
  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const row = await contentService.adminCreatePage(parsed.data)
  await emitMercflowPageChanged(req.scope, storeId)
  res.status(201).json({ page: row })
}
