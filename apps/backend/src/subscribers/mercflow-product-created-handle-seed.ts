import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { slugifyForStrategy } from "@mercflow/seo-module/slug"

import { SEO_MODULE } from "@mercflow/seo-module"

import {
  PREV_HANDLE_METADATA_KEY,
  resolveDefaultStoreId,
} from "./mercflow-seo-subscriber-utils"

type ProductLike = {
  id: string
  title?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

export default async function mercflowProductCreatedHandleSeedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const storeId = await resolveDefaultStoreId(container)
  if (!storeId) {
    return
  }

  const productModule = container.resolve(Modules.PRODUCT)
  const product = (await productModule.retrieveProduct(event.data.id, {
    select: ["id", "title", "handle", "metadata"],
  })) as ProductLike

  const seoService = container.resolve(SEO_MODULE) as {
    getOrCreateSeoConfig: (id: string) => Promise<{ slug_strategy: "nordic" | "omit" }>
  }
  const config = await seoService.getOrCreateSeoConfig(storeId)

  let handle = product.handle?.trim() ?? ""
  const title = product.title?.trim()
  if (title) {
    const desiredHandle = slugifyForStrategy(title, config.slug_strategy)
    if (desiredHandle && desiredHandle !== handle) {
      await productModule.updateProducts(product.id, { handle: desiredHandle })
      handle = desiredHandle
    }
  }

  if (!handle) {
    return
  }

  const metadata = product.metadata ?? {}
  if (metadata[PREV_HANDLE_METADATA_KEY] === handle) {
    return
  }

  await productModule.updateProducts(product.id, {
    metadata: { ...metadata, [PREV_HANDLE_METADATA_KEY]: handle },
  })
}

export const config: SubscriberConfig = {
  event: "product.created",
}
