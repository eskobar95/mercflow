import { describe, expect, it } from "vitest"
import { countVariantsWithDistinctShippingDrafts, emptyVariantShippingDraft } from "./variantShippingDraft"
describe("variantShippingDraft", () => {
  it("counts overwrite candidates", () => {
    expect(countVariantsWithDistinctShippingDrafts({
      shippingMap: {
        a: { lengthCm: "10", widthCm: "10", heightCm: "10", weightG: "100" },
        b: { lengthCm: "20", widthCm: "10", heightCm: "10", weightG: "100" },
        c: emptyVariantShippingDraft(),
      },
      comboKeys: ["a", "b", "c"],
      sourceComboKey: "a",
    })).toBe(1)
  })
})
