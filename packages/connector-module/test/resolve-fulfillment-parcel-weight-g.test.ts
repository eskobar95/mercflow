import { describe, expect, it, vi } from "vitest"

import { resolveFulfillmentParcelWeightG } from "../src/modules/connector/resolve-fulfillment-parcel-weight-g"

describe("resolveFulfillmentParcelWeightG", (): void => {
  it("sums variant weight × fulfillment item quantity", async (): Promise<void> => {
    const graph = vi.fn(async (input: { entity: string; fields: string[] }) => {
      if (input.entity === "fulfillment") {
        return {
          data: [
            {
              id: "ful_1",
              items: [{ line_item_id: "oli_1", quantity: 2 }],
              order: {
                items: [{ id: "oli_1", variant_id: "variant_1" }],
              },
            },
          ],
        }
      }
      if (input.entity === "variant") {
        return {
          data: [{ id: "variant_1", length: 100, width: 80, height: 40, weight: 250 }],
        }
      }
      return { data: [] }
    })

    const total = await resolveFulfillmentParcelWeightG({
      graph,
      fulfillmentId: "ful_1",
    })

    expect(total).toBe(500)
  })
})
