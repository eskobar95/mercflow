import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { SEO_MODULE } from "../modules/seo"
import type SeoModuleService from "../modules/seo/service"
import { resolveStoreIdFromHost } from "../modules/seo/tenant-resolver"

export type MercflowTenantRequest = MedusaRequest & {
  mercflowStoreId?: string
}

/**
 * Resolves tenant from Host (and optional X-Store-Id) for public MercFlow routes.
 * Fail closed → 404.
 */
export async function mercflowPublicTenantMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  const seoService = req.scope.resolve(SEO_MODULE) as SeoModuleService
  const hostHeader = typeof req.headers.host === "string" ? req.headers.host : undefined
  const storeIdHeader =
    typeof req.headers["x-store-id"] === "string" ? req.headers["x-store-id"] : undefined

  const storeId = await resolveStoreIdFromHost({
    hostHeader,
    storeIdHeader,
    lookup: {
      getStorefrontUrl: async (storeId: string): Promise<string | null> => {
        const config = await seoService.getSeoConfig(storeId)
        return config?.storefront_url ?? null
      },
    },
  })

  if (!storeId) {
    res.status(404).json({ message: "Not found" })
    return
  }

  ;(req as MercflowTenantRequest).mercflowStoreId = storeId
  next()
}
