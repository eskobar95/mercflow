import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type EventBusEmitter = {
  emit: (payload: { name: string; data: { store_id: string } }) => Promise<void>
}

/**
 * Notifies subscribers (e.g. sitemap cache) that CMS page content affecting public URLs changed.
 */
export async function emitMercflowPageChanged(
  scope: MedusaContainer,
  storeId: string
): Promise<void> {
  const eventBus = scope.resolve(Modules.EVENT_BUS) as EventBusEmitter
  await eventBus.emit({
    name: "mercflow.page.changed",
    data: { store_id: storeId },
  })
}
