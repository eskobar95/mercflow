import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { packagingTypeToAdminJson } from "../../../http/packaging-type-json"
import { sendZodError } from "../../../http/zod-error"
import { PACKAGING_MODULE } from "../../../../modules/packaging"
import { packagingTypePutBodySchema } from "../../../../modules/packaging/http-schemas"
import { resolveMercflowStoreId } from "../../../../modules/packaging/resolve-store-id"
import type PackagingModuleService from "../../../../modules/packaging/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const packagingTypeId = req.params.id
  if (!packagingTypeId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing packaging type id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(PACKAGING_MODULE) as unknown as PackagingModuleService
  const row = await service.retrievePackagingType(storeId, packagingTypeId)
  if (!row) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Packaging type "${packagingTypeId}" not found`
    )
  }

  res.status(200).json({ packaging_type: packagingTypeToAdminJson(row) })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const packagingTypeId = req.params.id
  if (!packagingTypeId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing packaging type id")
  }

  const parsed = packagingTypePutBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(PACKAGING_MODULE) as unknown as PackagingModuleService
  const row = await service.updatePackagingType(storeId, packagingTypeId, parsed.data)
  res.status(200).json({ packaging_type: packagingTypeToAdminJson(row) })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const packagingTypeId = req.params.id
  if (!packagingTypeId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing packaging type id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(PACKAGING_MODULE) as unknown as PackagingModuleService
  await service.deletePackagingType(storeId, packagingTypeId)
  res.status(204).send()
}
