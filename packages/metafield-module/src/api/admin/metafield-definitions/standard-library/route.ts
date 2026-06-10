import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  resolveAdminListLimit,
  resolveAdminListOffset,
} from "../../../http/admin-list-limit"
import { definitionToAdminJson } from "../../../http/definition-json"
import { sendZodError } from "../../../http/zod-error"
import { METAFIELD_MODULE } from "../../../../modules/metafield"
import { metafieldStandardLibraryQuerySchema } from "../../../../modules/metafield/http-schemas"
import { resolveMercflowStoreId } from "../../../../modules/metafield/resolve-store-id"
import type MetafieldModuleService from "../../../../modules/metafield/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = metafieldStandardLibraryQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const limit = resolveAdminListLimit(parsed.data.limit)
  const offset = resolveAdminListOffset(parsed.data.offset)
  const storeId = resolveMercflowStoreId(req)

  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  const { definitions, count } = await service.listStandardLibrary({
    vertical: parsed.data.vertical,
    storeId,
    ownerType: parsed.data.owner_type,
    limit,
    offset,
  })

  res.status(200).json({
    metafield_definitions: definitions.map((row) => definitionToAdminJson(row)),
    vertical: parsed.data.vertical,
    count,
    limit,
    offset,
  })
}
