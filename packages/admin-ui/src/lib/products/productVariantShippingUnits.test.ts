import { describe, expect, it } from "vitest"
import { displayCmToMedusaMm, displayGToMedusaG, medusaGToDisplayG, medusaMmToDisplayCm } from "./productVariantShippingUnits"
describe("productVariantShippingUnits", () => {
  it("converts mm/cm and grams", () => {
    expect(medusaMmToDisplayCm(300)).toBe("30")
    expect(displayCmToMedusaMm("30")).toBe(300)
    expect(medusaGToDisplayG(400)).toBe("400")
    expect(displayGToMedusaG("400")).toBe(400)
  })
})
