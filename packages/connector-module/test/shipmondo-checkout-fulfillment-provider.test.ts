import { describe, expect, it, vi } from "vitest"

import ShipmondoCheckoutFulfillmentProviderService from "../src/fulfillment-providers/shipmondo-checkout/service"
import { MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA } from "../src/fulfillment-providers/shipmondo-checkout/option-data"
import { CONNECTOR_MODULE } from "../src/modules/connector"

describe("ShipmondoCheckoutFulfillmentProviderService", (): void => {
  it("applies persisted markup via calculatePrice", async (): Promise<void> => {
    const getShipmondoStoreShippingRules = vi.fn(async () => ({
      active: true,
      markupAmountMinor: 100,
      freeShippingThresholdMinor: 0,
      enabledCarrierCodes: ["GLS_ERH"],
    }))

    const cradle = {
      resolve: vi.fn((key: string) => {
        if (key === CONNECTOR_MODULE) {
          return { getShipmondoStoreShippingRules }
        }
        throw new Error(`unexpected resolve(${key})`)
      }),
    }

    const svc = new ShipmondoCheckoutFulfillmentProviderService(cradle)
    const price = await svc.calculatePrice(
      {
        [MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA.productCode]: "GLS_ERH",
        [MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA.basePriceMinor]: 4900,
      },
      {},
      {
        item_subtotal: 10_000,
        items: [],
      }
    )

    expect(price.calculated_amount).toBe(5000)
    expect(price.is_calculated_price_tax_inclusive).toBe(false)
    expect(getShipmondoStoreShippingRules).toHaveBeenCalledOnce()
  })

  it("applies connector free-shipping threshold at checkout calculation", async (): Promise<void> => {
    const getShipmondoStoreShippingRules = vi.fn(async () => ({
      active: true,
      markupAmountMinor: 100,
      freeShippingThresholdMinor: 8000,
      enabledCarrierCodes: ["GLS_ERH"],
    }))

    const cradle = {
      resolve: vi.fn((key: string) => {
        if (key === CONNECTOR_MODULE) {
          return { getShipmondoStoreShippingRules }
        }
        throw new Error(`unexpected resolve(${key})`)
      }),
    }

    const svc = new ShipmondoCheckoutFulfillmentProviderService(cradle)
    const price = await svc.calculatePrice(
      {
        [MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA.productCode]: "GLS_ERH",
        [MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA.basePriceMinor]: 4900,
      },
      {},
      {
        item_subtotal: 10_000,
        items: [],
      }
    )

    expect(price.calculated_amount).toBe(0)
  })

  it("surfaces blocked carrier catalogue rows with a sentinel listing price", async (): Promise<void> => {
    const getShipmondoStoreShippingRules = vi.fn(async () => ({
      active: true,
      markupAmountMinor: 0,
      freeShippingThresholdMinor: 0,
      enabledCarrierCodes: ["UPS_ONLY"],
    }))

    const cradle = {
      resolve: vi.fn((key: string) => {
        if (key === CONNECTOR_MODULE) {
          return { getShipmondoStoreShippingRules }
        }
        throw new Error(`unexpected resolve(${key})`)
      }),
    }

    const svc = new ShipmondoCheckoutFulfillmentProviderService(cradle)
    const price = await svc.calculatePrice(
      {
        [MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA.productCode]: "GLS_ERH",
        [MERCFLOW_SHIPMONDO_SHIPPING_OPTION_DATA.basePriceMinor]: 4900,
      },
      {},
      {
        item_subtotal: 10_000,
        items: [],
      }
    )

    expect(price.calculated_amount).toBe(99_999_999)
  })
})
