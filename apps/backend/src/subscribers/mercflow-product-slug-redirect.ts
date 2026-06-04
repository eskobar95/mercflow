import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

import { SEO_MODULE } from "@mercflow/seo-module"

import {
  PREV_HANDLE_METADATA_KEY,
  resolveDefaultStoreId,
} from "./mercflow-seo-subscriber-utils"

type ProductLike = {
  id: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
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
