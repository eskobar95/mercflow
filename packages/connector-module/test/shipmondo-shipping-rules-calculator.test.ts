import { describe, expect, it } from "vitest"

import {
  calculateShipmondoCheckoutShippingMinor,
  defaultShipmondoShippingRules,
} from "../src/modules/connector/shipmondo-shipping-rules"

describe("calculateShipmondoCheckoutShippingMinor", (): void => {
  it("applies markup in minor currency units before threshold logic", (): void => {
    const rules = {
      ...defaultShipmondoShippingRules(),
      markupAmountMinor: 100,
      freeShippingThresholdMinor: 0,
    }

    const result = calculateShipmondoCheckoutShippingMinor({
      cartSubtotalExShippingMinor: 5_000,
      carrierProductCode: "PN_HOME",
      basePriceMinorFromProvider: 4_900,
      rules,
    })

    expect(result).toEqual({ priceMinor: 5_000, reason: "priced" })
  })

  it("zeroes Shipmondo price when cart clears the connector threshold", (): void => {
    const rules = {
      ...defaultShipmondoShippingRules(),
      markupAmountMinor: 50,
      freeShippingThresholdMinor: 10_000,
    }

    expect(
      calculateShipmondoCheckoutShippingMinor({
        cartSubtotalExShippingMinor: 10_500,
        carrierProductCode: "GLS_BOX",
        basePriceMinorFromProvider: 4_900,
        rules,
      })
    ).toEqual({ priceMinor: 0, reason: "free_shipping_threshold" })
  })

  it("drops rates that are excluded via enabledCarrierCodes whitelist", (): void => {
    const rules = {
      ...defaultShipmondoShippingRules(),
      enabledCarrierCodes: ["ALLOWED_ONLY"],
      markupAmountMinor: 0,
    }

    expect(
      calculateShipmondoCheckoutShippingMinor({
        cartSubtotalExShippingMinor: 1,
        carrierProductCode: "BLOCKED",
        basePriceMinorFromProvider: 100,
        rules,
      })
    ).toEqual({ priceMinor: -1, reason: "disabled" })
  })

  it("permits arbitrary products when whitelist is empty", (): void => {
    const rules = defaultShipmondoShippingRules()

    expect(
      calculateShipmondoCheckoutShippingMinor({
        cartSubtotalExShippingMinor: 1,
        carrierProductCode: "ANYTHING",
        basePriceMinorFromProvider: 200,
        rules,
      }).reason
    ).toEqual("priced")
  })
})
