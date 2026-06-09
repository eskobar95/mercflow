import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { metafieldValueRecordToAdminJson } from "../../../http/metafield-value-json"
import { sendZodError } from "../../../http/zod-error"
import { METAFIELD_MODULE } from "../../../../modules/metafield"
import { metafieldValuesBatchBodySchema } from "../../../../modules/metafield/http-schemas"
import { resolveMercflowStoreId } from "../../../../modules/metafield/resolve-store-id"
import type MetafieldModuleService from "../../../../modules/metafield/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const parsed = metafieldValuesBatchBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  const rows = await service.batchUpsertValues(storeId, parsed.data.values)

  res.status(200).json({
    metafield_values: rows.map((row) => metafieldValueRecordToAdminJson(row)),
    count: rows.length,
  })
}
