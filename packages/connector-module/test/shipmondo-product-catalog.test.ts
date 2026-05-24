import { describe, expect, it } from "vitest"

import { parseShipmondoCarrierProductsEnvelope } from "../src/modules/connector/shipmondo-product-catalog"

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
})
