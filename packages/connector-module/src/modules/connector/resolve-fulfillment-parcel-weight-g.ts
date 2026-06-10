import { MedusaError } from "@medusajs/utils"

import { computePackagingTotals } from "@mercflow/packaging-module/suggest-packaging"
import { createVariantDimensionLoader } from "@mercflow/packaging-module/variant-dimensions"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === "string" ? value.trim() : ""
}

function readPositiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }
  const rounded = Math.round(value)
  return rounded > 0 ? rounded : null
}

type RemoteGraph = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: unknown[] }>
}

/**
 * Sum variant shipping weights (grams) for items on a fulfillment.
 * Uses the same rules as packaging suggest (variant.weight × fulfilled quantity).
 */
export async function resolveFulfillmentParcelWeightG(input: {
  graph: RemoteGraph["graph"]
  fulfillmentId: string
}): Promise<number> {
  const { data } = await input.graph({
    entity: "fulfillment",
    fields: ["id", "items.quantity", "items.line_item_id", "order.items.id", "order.items.variant_id"],
    filters: { id: input.fulfillmentId },
  })

  const fulfillment = data.find(isRecord)
  if (fulfillment === undefined) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Fulfillment ${input.fulfillmentId} was not found`
    )
  }

  const order = fulfillment.order
  const orderItems = isRecord(order) && Array.isArray(order.items) ? order.items : []
  const variantIdByLineItemId = new Map<string, string>()
  for (const raw of orderItems) {
    if (!isRecord(raw)) {
      continue
    }
    const lineItemId = readString(raw, "id")
    const variantId = readString(raw, "variant_id")
    if (lineItemId !== "" && variantId !== "") {
      variantIdByLineItemId.set(lineItemId, variantId)
    }
  }

  const fulfillmentItems = Array.isArray(fulfillment.items) ? fulfillment.items : []
  const suggestItems: Array<{ variantId: string; quantity: number }> = []

  for (const raw of fulfillmentItems) {
    if (!isRecord(raw)) {
      continue
    }
    const lineItemId = readString(raw, "line_item_id")
    const quantity = readPositiveInt(raw.quantity)
    if (lineItemId === "" || quantity === null) {
      continue
    }
    const variantId = variantIdByLineItemId.get(lineItemId)
    if (variantId === undefined || variantId === "") {
      continue
    }
    suggestItems.push({ variantId, quantity })
  }

  if (suggestItems.length === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Fulfillment has no line items with variant IDs — cannot calculate parcel weight for Shipmondo"
    )
  }

  const loadVariantDimensions = createVariantDimensionLoader({ graph: input.graph })
  const variantIds = [...new Set(suggestItems.map((item) => item.variantId))]
  const variants = await loadVariantDimensions(variantIds)
  const { totalWeightG } = computePackagingTotals(suggestItems, variants)

  if (totalWeightG <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Fulfillment parcel weight must be greater than zero — add variant shipping weights on products"
    )
  }

  return totalWeightG
}
