import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

import { SEO_MODULE } from "@mercflow/seo-module"

const PREV_HANDLE_METADATA_KEY = "mercflow_prev_handle"

type ProductLike = {
  id: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

async function resolveDefaultStoreId(container: SubscriberArgs["container"]): Promise<string | null> {
  const envDefault = process.env.MERCFLOW_DEFAULT_STORE_ID
  if (typeof envDefault === "string" && envDefault.length > 0) {
    return envDefault
  }
  try {
    const storeModule = container.resolve(Modules.STORE)
    const stores = await storeModule.listStores({}, { take: 1 })
    const first = stores[0] as { id?: string } | undefined
    return typeof first?.id === "string" ? first.id : null
  } catch {
    return null
  }
}

async function persistPreviousHandle(
  container: SubscriberArgs["container"],
  product: ProductLike,
  handle: string
): Promise<void> {
  const productModule = container.resolve(Modules.PRODUCT)
  const metadata = { ...(product.metadata ?? {}), [PREV_HANDLE_METADATA_KEY]: handle }
  await productModule.updateProducts(product.id, { metadata })
}

export default async function mercflowProductSlugRedirectHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const productId = event.data.id
  const storeId = await resolveDefaultStoreId(container)
  if (!storeId) {
    return
  }

  const productModule = container.resolve(Modules.PRODUCT)
  const product = (await productModule.retrieveProduct(productId, {
    select: ["id", "handle", "metadata"],
  })) as ProductLike

  const currentHandle = product.handle?.trim()
  if (!currentHandle) {
    return
  }

  const metadata = product.metadata ?? {}
  const previousRaw = metadata[PREV_HANDLE_METADATA_KEY]
  const previousHandle =
    typeof previousRaw === "string" && previousRaw.length > 0 ? previousRaw : null

  if (previousHandle && previousHandle !== currentHandle) {
    const seoService = container.resolve(SEO_MODULE) as {
      recordProductHandleChange: (
        storeId: string,
        previousHandle: string,
        nextHandle: string
      ) => Promise<unknown>
    }
    await seoService.recordProductHandleChange(storeId, previousHandle, currentHandle)
  }

  if (previousHandle !== currentHandle) {
    await persistPreviousHandle(container, product, currentHandle)
  }
}

export const config: SubscriberConfig = {
  event: "product.updated",
}
