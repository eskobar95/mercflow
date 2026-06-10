import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../http/admin-list-limit"
import { definitionToAdminJson } from "../../http/definition-json"
import { resolveCategoryAncestorIds } from "../../http/resolve-category-ancestor-ids"
import { sendZodError } from "../../http/zod-error"
import { METAFIELD_MODULE } from "../../../modules/metafield"
import {
  metafieldDefinitionPostBodySchema,
  metafieldDefinitionsListQuerySchema,
} from "../../../modules/metafield/http-schemas"
import { resolveMercflowStoreId } from "../../../modules/metafield/resolve-store-id"
import type MetafieldModuleService from "../../../modules/metafield/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = metafieldDefinitionsListQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = resolveAdminListLimit(parsed.data.limit)
  const offset = resolveAdminListOffset(parsed.data.offset)
  const storeId = resolveMercflowStoreId(req)

  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService

  let categoryConstraintIds: string[] | undefined
  if (parsed.data.category_id) {
    categoryConstraintIds = await resolveCategoryAncestorIds(req, parsed.data.category_id)
  }

  const { definitions, count } = await service.listDefinitions({
    ownerType: parsed.data.owner_type,
    storeId,
    categoryConstraintIds,
    limit,
    offset,
  })

  res.status(200).json({
    metafield_definitions: definitions.map((row) => definitionToAdminJson(row)),
    count,
    limit,
    offset,
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const parsed = metafieldDefinitionPostBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  const row = await service.createDefinition(storeId, parsed.data)
  res.status(201).json({ metafield_definition: definitionToAdminJson(row) })
}
