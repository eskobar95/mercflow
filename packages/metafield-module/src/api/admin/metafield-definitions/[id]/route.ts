import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { definitionToAdminJson } from "../../../http/definition-json"
import { sendZodError } from "../../../http/zod-error"
import { METAFIELD_MODULE } from "../../../../modules/metafield"
import { metafieldDefinitionPutBodySchema } from "../../../../modules/metafield/http-schemas"
import { resolveMercflowStoreId } from "../../../../modules/metafield/resolve-store-id"
import type MetafieldModuleService from "../../../../modules/metafield/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const definitionId = req.params.id
  if (!definitionId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing metafield definition id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  const row = await service.getDefinition(storeId, definitionId)
  res.status(200).json({ metafield_definition: definitionToAdminJson(row) })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const definitionId = req.params.id
  if (!definitionId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing metafield definition id")
  }

  const parsed = metafieldDefinitionPutBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  const row = await service.updateDefinition(storeId, definitionId, parsed.data)
  res.status(200).json({ metafield_definition: definitionToAdminJson(row) })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const definitionId = req.params.id
  if (!definitionId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing metafield definition id")
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  await service.deleteDefinition(storeId, definitionId)
  res.status(204).send()
}
