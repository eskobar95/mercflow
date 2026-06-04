import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

const PREV_HANDLE_METADATA_KEY = "mercflow_prev_handle"

type ProductLike = {
  id: string
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

export default async function mercflowProductCreatedHandleSeedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const productModule = container.resolve(Modules.PRODUCT)
  const product = (await productModule.retrieveProduct(event.data.id, {
    select: ["id", "handle", "metadata"],
  })) as ProductLike

  const handle = product.handle?.trim()
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
