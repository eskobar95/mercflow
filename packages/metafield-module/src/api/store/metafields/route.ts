import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { resolveStoreMetafieldStoreId } from "../../http/resolve-store-metafield-store-id"
import { metafieldValueListItemToStoreJson } from "../../http/metafield-value-json"
import { sendZodError } from "../../http/zod-error"
import { METAFIELD_MODULE } from "../../../modules/metafield"
import { metafieldStoreListQuerySchema } from "../../../modules/metafield/http-schemas"
import type MetafieldModuleService from "../../../modules/metafield/service"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = metafieldStoreListQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = await resolveStoreMetafieldStoreId(req)
  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  const values = await service.listValues(storeId, {
    ownerType: parsed.data.owner_type,
    ownerId: parsed.data.owner_id,
    locale: parsed.data.locale,
  })

  res.status(200).json({
    metafields: values.map((item) => metafieldValueListItemToStoreJson(item)),
    count: values.length,
  })
}
