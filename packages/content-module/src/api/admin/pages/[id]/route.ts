import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { emitMercflowPageChanged } from "../../../http/emit-mercflow-page-changed"
import { resolveAdminStoreId } from "../../../http/resolve-admin-store-id"
import { sendZodError } from "../../../http/zod-error"
import { CONTENT_MODULE } from "../../../../modules/content"
import { adminPagePatchBodySchema } from "../../../../modules/content/http-schemas"
import type ContentModuleService from "../../../../modules/content/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const id = req.params.id
  if (!id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing page id")
  }

  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const row = await contentService.adminRetrievePage(id)
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Page "${id}" not found`)
  }
  res.status(200).json({ page: row })
}

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const id = req.params.id
  if (!id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing page id")
  }

  const parsed = adminPagePatchBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const storeId = resolveAdminStoreId(req)
  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  const { page, changed } = await contentService.adminUpdatePage(id, parsed.data)
  if (changed) {
    await emitMercflowPageChanged(req.scope, storeId)
  }
  res.status(200).json({ page })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const id = req.params.id
  if (!id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing page id")
  }

  const storeId = resolveAdminStoreId(req)
  const contentService = req.scope.resolve(CONTENT_MODULE) as ContentModuleService
  await contentService.adminSoftDeletePage(id)
  await emitMercflowPageChanged(req.scope, storeId)
  res.status(204).send()
}
