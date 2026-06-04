import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

import { SEO_MODULE } from "@mercflow/seo-module"

import {
  PREV_HANDLE_METADATA_KEY,
  resolveDefaultStoreId,
} from "./mercflow-seo-subscriber-utils"

type CategoryLike = {
  id: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

export default async function mercflowCategorySlugRedirectHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const categoryId = event.data.id
  const storeId = await resolveDefaultStoreId(container)
  if (!storeId) {
    return
  }

  const productModule = container.resolve(Modules.PRODUCT)
  const category = (await productModule.retrieveProductCategory(categoryId, {
    select: ["id", "handle", "metadata"],
  })) as CategoryLike

  const currentHandle = category.handle?.trim()
  if (!currentHandle) {
    return
  }

  const metadata = category.metadata ?? {}
  const previousRaw = metadata[PREV_HANDLE_METADATA_KEY]
  const previousHandle =
    typeof previousRaw === "string" && previousRaw.length > 0 ? previousRaw : null

  if (previousHandle && previousHandle !== currentHandle) {
    const seoService = container.resolve(SEO_MODULE) as {
      recordCategoryHandleChange: (
        storeId: string,
        previousHandle: string,
        nextHandle: string
      ) => Promise<unknown>
    }
    await seoService.recordCategoryHandleChange(storeId, previousHandle, currentHandle)
  }

  if (previousHandle !== currentHandle) {
    const nextMetadata = { ...metadata, [PREV_HANDLE_METADATA_KEY]: currentHandle }
    await productModule.updateProductCategories(category.id, { metadata: nextMetadata })
  }
}

export const config: SubscriberConfig = {
  event: "product_category.updated",
}
