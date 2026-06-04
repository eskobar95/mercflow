import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { slugifyForStrategy } from "@mercflow/seo-module/slug"

import { SEO_MODULE } from "@mercflow/seo-module"

import {
  PREV_HANDLE_METADATA_KEY,
  resolveDefaultStoreId,
} from "./mercflow-seo-subscriber-utils"

type CategoryLike = {
  id: string
  name?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

export default async function mercflowCategoryCreatedHandleSeedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const storeId = await resolveDefaultStoreId(container)
  if (!storeId) {
    return
  }

  const productModule = container.resolve(Modules.PRODUCT)
  const category = (await productModule.retrieveProductCategory(event.data.id, {
    select: ["id", "name", "handle", "metadata"],
  })) as CategoryLike

  const seoService = container.resolve(SEO_MODULE) as {
    getOrCreateSeoConfig: (id: string) => Promise<{ slug_strategy: "nordic" | "omit" }>
  }
  const config = await seoService.getOrCreateSeoConfig(storeId)

  let handle = category.handle?.trim() ?? ""
  const name = category.name?.trim()
  if (name) {
    const desiredHandle = slugifyForStrategy(name, config.slug_strategy)
    if (desiredHandle && desiredHandle !== handle) {
      await productModule.updateProductCategories(category.id, { handle: desiredHandle })
      handle = desiredHandle
    }
  }

  if (!handle) {
    return
  }

  const metadata = category.metadata ?? {}
  if (metadata[PREV_HANDLE_METADATA_KEY] === handle) {
    return
  }

  await productModule.updateProductCategories(category.id, {
    metadata: { ...metadata, [PREV_HANDLE_METADATA_KEY]: handle },
  })
}

export const config: SubscriberConfig = {
  event: "product_category.created",
}
