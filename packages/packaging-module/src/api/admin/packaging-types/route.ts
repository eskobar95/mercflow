import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import { packagingTypeToAdminJson } from "../../http/packaging-type-json"
import { sendZodError } from "../../http/zod-error"
import { PACKAGING_MODULE } from "../../../modules/packaging"
import {
  adminListQuerySchema,
  packagingTypePostBodySchema,
} from "../../../modules/packaging/http-schemas"
import { resolveMercflowStoreId } from "../../../modules/packaging/resolve-store-id"
import type PackagingModuleService from "../../../modules/packaging/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = adminListQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = Math.min(resolveAdminListLimit(parsed.data.limit), 100)
  const offset = resolveAdminListOffset(parsed.data.offset)
  const includeDeleted = parsed.data.include_deleted === "true"

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(PACKAGING_MODULE) as unknown as PackagingModuleService
  const { packaging_types, count } = await service.listPackagingTypes(storeId, {
    limit,
    offset,
    includeDeleted,
  })

  res.status(200).json({
    packaging_types: packaging_types.map((row) => packagingTypeToAdminJson(row)),
    count,
    limit,
    offset,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = packagingTypePostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(PACKAGING_MODULE) as unknown as PackagingModuleService
  const row = await service.createPackagingType(storeId, parsed.data)
  res.status(201).json({ packaging_type: packagingTypeToAdminJson(row) })
}
