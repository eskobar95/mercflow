import type { SubscriberArgs } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export const PREV_HANDLE_METADATA_KEY = "mercflow_prev_handle"

export async function resolveDefaultStoreId(
  container: SubscriberArgs["container"]
): Promise<string | null> {
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
