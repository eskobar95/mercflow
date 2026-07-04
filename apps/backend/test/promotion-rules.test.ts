import { describe, expect, it } from "vitest"

import {
  buildPromotionRulesFromDiscountBody,
  formatFreeShippingConditionsLabel,
  majorToMinorAmount,
  minorToMajorAmount,
  parsePromotionRules,
} from "../src/lib/discounts/promotion-rules"

describe("promotion rules", (): void => {
  it("converts major/minor amounts for DKK", (): void => {
    expect(majorToMinorAmount(499, "dkk")).toBe(49900)
    expect(minorToMajorAmount(49900, "dkk")).toBe(499)
  })

  it("builds subtotal gte rule from minimum purchase amount", (): void => {
    const rules = buildPromotionRulesFromDiscountBody(
      { minimum_purchase_amount: 499 },
      "dkk",
    )

    expect(rules).toEqual([
      {
        attribute: "subtotal",
        operator: "gte",
        values: ["49900"],
      },
    ])
  })

  it("parses rules from remote query shape with nested values", (): void => {
    const parsed = parsePromotionRules(
      [
        {
          attribute: "subtotal",
          operator: "gte",
          values: [{ value: "49900" }],
        },
        {
          attribute: "shipping_address.country_code",
          operator: "in",
          values: [{ value: "DK" }, { value: "SE" }],
        },
      ],
      "dkk",
    )

    expect(parsed.minimum_order_amount).toBe(499)
    expect(parsed.shipping_country_codes).toEqual(["DK", "SE"])
  })

  it("formats plain-language free shipping conditions", (): void => {
    expect(
      formatFreeShippingConditionsLabel({
        currencyCode: "dkk",
        minimumOrderAmount: 499,
        maximumOrderAmount: null,
        countryCodes: ["DK"],
      }),
    ).toBe("When order is at least 499 DKK and shipping country is DK")

    expect(
      formatFreeShippingConditionsLabel({
        currencyCode: "dkk",
        minimumOrderAmount: null,
        maximumOrderAmount: null,
        countryCodes: null,
      }),
    ).toBe("All orders with shipping — no minimum order value")
  })
})
