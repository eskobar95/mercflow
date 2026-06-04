import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { resolveAdminStoreId } from "../../../http/resolve-admin-store-id"
import { SEO_MODULE } from "../../../../modules/seo"
import type SeoModuleService from "../../../../modules/seo/service"

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const id = req.params.id
  if (!id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing redirect id")
  }
  const storeId = resolveAdminStoreId(req)
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  await seoService.deleteRedirect(storeId, id)
  res.status(200).json({ id, deleted: true })
}
