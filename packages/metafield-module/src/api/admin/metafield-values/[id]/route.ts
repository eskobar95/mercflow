import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { METAFIELD_MODULE } from "../../../../modules/metafield"
import { resolveMercflowStoreId } from "../../../../modules/metafield/resolve-store-id"
import type MetafieldModuleService from "../../../../modules/metafield/service"

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const storeId = resolveMercflowStoreId(req)
  const valueId = req.params.id
  if (typeof valueId !== "string" || valueId.trim() === "") {
    res.status(400).json({ message: "id is required" })
    return
  }

  const service = req.scope.resolve(METAFIELD_MODULE) as unknown as MetafieldModuleService
  await service.deleteValue(storeId, valueId.trim())
  res.status(200).json({ id: valueId.trim(), deleted: true })
}
