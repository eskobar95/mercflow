import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { packagingTypeToAdminJson } from "../../../http/packaging-type-json"
import { createVariantDimensionLoader } from "../../../http/variant-dimensions"
import { sendZodError } from "../../../http/zod-error"
import { PACKAGING_MODULE } from "../../../../modules/packaging"
import { suggestPackagingBodySchema } from "../../../../modules/packaging/http-schemas"
import { resolveMercflowStoreId } from "../../../../modules/packaging/resolve-store-id"
import type PackagingModuleService from "../../../../modules/packaging/service"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = suggestPackagingBodySchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    sendZodError(parsed.error)
  }

  const storeId = resolveMercflowStoreId(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data: unknown[] }>
  }
  const loadVariantDimensions = createVariantDimensionLoader(query)

  const service = req.scope.resolve(PACKAGING_MODULE) as unknown as PackagingModuleService
  const result = await service.suggestPackaging(
    storeId,
    parsed.data.items.map((item) => ({
      variantId: item.variant_id,
      quantity: item.quantity,
    })),
    loadVariantDimensions
  )

  res.status(200).json({
    suggested: result.suggested ? packagingTypeToAdminJson(result.suggested) : null,
    total_volume_mm3: result.total_volume_mm3,
    total_weight_g: result.total_weight_g,
  })
}
