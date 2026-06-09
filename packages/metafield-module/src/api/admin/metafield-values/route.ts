import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { metafieldValueListItemToAdminJson } from "../../http/metafield-value-json"
import { sendZodError } from "../../http/zod-error"
import { METAFIELD_MODULE } from "../../../modules/metafield"
import { metafieldValuesListQuerySchema } from "../../../modules/metafield/http-schemas"
import { resolveMercflowStoreId } from "../../../modules/metafield/resolve-store-id"
import type MetafieldModuleService from "../../../modules/metafield/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = metafieldValuesListQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  const values = await service.listValues(storeId, {
    ownerType: parsed.data.owner_type,
    ownerId: parsed.data.owner_id,
    locale: parsed.data.locale,
  })

  res.status(200).json({
    metafield_values: values.map((item) => metafieldValueListItemToAdminJson(item)),
    count: values.length,
  })
}
