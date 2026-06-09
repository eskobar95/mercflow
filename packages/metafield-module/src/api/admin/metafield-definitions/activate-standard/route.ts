import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { definitionToAdminJson } from "../../../http/definition-json"
import { sendZodError } from "../../../http/zod-error"
import { METAFIELD_MODULE } from "../../../../modules/metafield"
import { metafieldActivateStandardBodySchema } from "../../../../modules/metafield/http-schemas"
import { resolveMercflowStoreId } from "../../../../modules/metafield/resolve-store-id"
import type MetafieldModuleService from "../../../../modules/metafield/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const parsed = metafieldActivateStandardBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  const result = await service.activateStandardDefinitions(storeId, {
    vertical: parsed.data.vertical,
    definitionIds: parsed.data.definition_ids,
  })

  res.status(201).json({
    metafield_definitions: result.activated.map((row) => definitionToAdminJson(row)),
    skipped_keys: result.skipped_keys,
    count: result.activated.length,
  })
}
