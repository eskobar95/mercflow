import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { sendZodError } from "../../../http/zod-error"
import { pickListQuerySchema } from "../../../../modules/inventory/http-schemas"
import {
  buildPickListFromOrders,
  resolvePickListDayIso,
} from "../../../../modules/inventory/pick-list"
import { resolveMercflowStoreId } from "../../../../modules/inventory/resolve-store-id"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const parsed = pickListQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendZodError(res, parsed.error)
    return
  }

  const storeId = resolveMercflowStoreId(req)
  const dayIso = resolvePickListDayIso(parsed.data.date)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data: unknown[] }>
  }

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "created_at",
      "updated_at",
      "payment_status",
      "fulfillment_status",
      "items.id",
      "items.title",
      "items.variant_title",
      "items.quantity",
      "items.fulfilled_quantity",
      "items.variant_sku",
      "items.sku",
      "fulfillments.id",
      "fulfillments.created_at",
      "fulfillments.shipped_at",
      "fulfillments.canceled_at",
      "fulfillments.shipments.id",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.city",
      "customer.first_name",
      "customer.last_name",
      "customer.email",
    ],
  })

  const orders = data.filter(isRecord)
  const groups = buildPickListFromOrders(orders, dayIso)

  res.status(200).json({
    store_id: storeId,
    date: parsed.data.date,
    day: dayIso,
    orders: groups,
  })
}
