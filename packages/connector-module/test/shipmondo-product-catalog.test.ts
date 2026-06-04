import { describe, expect, it } from "vitest"

import {
  coerceToMinorUnitsFromUnknownPrice,
  parseShipmondoCarrierProductsEnvelope,
} from "../src/modules/connector/shipmondo-product-catalog"

describe("coerceToMinorUnitsFromUnknownPrice", (): void => {
  it("treats numeric integer major-unit values as DKK and multiplies by 100", (): void => {
    expect(coerceToMinorUnitsFromUnknownPrice(49)).toBe(4900)
    expect(coerceToMinorUnitsFromUnknownPrice(0)).toBe(0)
    expect(coerceToMinorUnitsFromUnknownPrice(1)).toBe(100)
  })

  it("treats numeric float values as major units and multiplies by 100", (): void => {
    expect(coerceToMinorUnitsFromUnknownPrice(49.5)).toBe(4950)
    expect(coerceToMinorUnitsFromUnknownPrice(0.99)).toBe(99)
  })

  it("treats string numeric values as major units and multiplies by 100", (): void => {
    expect(coerceToMinorUnitsFromUnknownPrice("49")).toBe(4900)
    expect(coerceToMinorUnitsFromUnknownPrice("49.50")).toBe(4950)
  })

  it("returns numbers >= 500 000 as-is (already in minor units)", (): void => {
    expect(coerceToMinorUnitsFromUnknownPrice(500_000)).toBe(500_000)
    expect(coerceToMinorUnitsFromUnknownPrice(1_000_000)).toBe(1_000_000)
  })

  it("returns null for non-numeric or empty inputs", (): void => {
    expect(coerceToMinorUnitsFromUnknownPrice(null)).toBeNull()
    expect(coerceToMinorUnitsFromUnknownPrice(undefined)).toBeNull()
    expect(coerceToMinorUnitsFromUnknownPrice("")).toBeNull()
    expect(coerceToMinorUnitsFromUnknownPrice("abc")).toBeNull()
    expect(coerceToMinorUnitsFromUnknownPrice(NaN)).toBeNull()
    expect(coerceToMinorUnitsFromUnknownPrice(Infinity)).toBeNull()
  })
})

describe("parseShipmondoCarrierProductsEnvelope", (): void => {
  it("normalizes loosely shaped carrier product payloads into stable rows", (): void => {
    const parsed = parseShipmondoCarrierProductsEnvelope({
      carrier_products: [
        {
          carrier_code: "postnord",
          product_code: "PN_STANDARD",
          name: "PostNord",
          sales_price: "49",
        },
        {
          carrier_code: "gls",
          code: "GLS_DROP",
          title: "GLS Locker",
          price_minor: 3900,
        },
      ],
    })

    expect(parsed).toEqual([
      {
        productCode: "GLS_DROP",
        carrierCode: "gls",
        name: "GLS Locker",
        basePriceMinor: 3900,
      },
      {
        productCode: "PN_STANDARD",
        carrierCode: "postnord",
        name: "PostNord",
        basePriceMinor: 4900,
      },
    ])
  })

  it("handles numeric integer sales_price (Shipmondo may return 49 not '49')", (): void => {
    const parsed = parseShipmondoCarrierProductsEnvelope({
      carrier_products: [
        {
          carrier_code: "dao",
          product_code: "DAO_HOME",
          name: "DAO Hjemlevering",
          sales_price: 49,
        },
      ],
    })

    expect(parsed).toEqual([
      {
        productCode: "DAO_HOME",
        carrierCode: "dao",
        name: "DAO Hjemlevering",
        basePriceMinor: 4900,
      },
    ])
  })
})
