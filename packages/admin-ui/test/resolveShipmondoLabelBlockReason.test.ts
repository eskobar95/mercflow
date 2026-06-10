import { describe, expect, it } from "vitest"

import { resolveShipmondoLabelBlockReason } from "@/features/orders/resolveShipmondoLabelBlockReason"

describe("resolveShipmondoLabelBlockReason", (): void => {
  it("blocks when line items lack variant ids", (): void => {
    const reason = resolveShipmondoLabelBlockReason({
      lineItems: [
        {
          id: "oli_1",
          title: "Item",
          variantLabel: "",
          variantId: null,
          quantity: 1,
          unitPriceMinor: 100,
          rowTotalMinor: 100,
          thumbnailUrl: null,
        },
      ],
      packagingLoadState: "ready",
      packagingErrorMessage: null,
      suggestion: null,
    })
    expect(reason).toMatch(/variant IDs/i)
  })

  it("allows when total order weight is positive", (): void => {
    const reason = resolveShipmondoLabelBlockReason({
      lineItems: [
        {
          id: "oli_1",
          title: "Item",
          variantLabel: "Default",
          variantId: "variant_1",
          quantity: 2,
          unitPriceMinor: 100,
          rowTotalMinor: 200,
          thumbnailUrl: null,
        },
      ],
      packagingLoadState: "ready",
      packagingErrorMessage: null,
      suggestion: { suggested: null, total_volume_mm3: 1000, total_weight_g: 750 },
    })
    expect(reason).toBeNull()
  })
})
