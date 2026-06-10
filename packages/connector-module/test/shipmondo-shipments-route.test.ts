import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import type { ShipmondoCreateLabelResultDto } from "../src/modules/connector/types"

import { POST as POSTShipmondoShipment } from "../src/api/admin/connectors/shipmondo/shipments/route"

const sampleResult: ShipmondoCreateLabelResultDto = {
  shipmentId: 12345,
  trackingUrl: "https://track.example/12345",
  labelPdfBase64: "JVBERi0x",
  productCode: "GLSDK_SD",
  reference: "Order #1001",
}

describe("POST /admin/connectors/shipmondo/shipments", (): void => {
  it("validates body and delegates to createShipmentLabel", async (): Promise<void> => {
    const createShipmentLabel = vi.fn(async (): Promise<ShipmondoCreateLabelResultDto> => sampleResult)

    const req = {
      body: {
        fulfillment_id: "ful_123",
        packaging_type_id: "pkg_456",
      },
      query: { store_id: "store_1" },
      scope: {
        resolve: vi.fn().mockReturnValue({
          createShipmentLabel,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await POSTShipmondoShipment(req, res)

    expect(createShipmentLabel).toHaveBeenCalledWith({
      storeId: "store_1",
      fulfillmentId: "ful_123",
      packagingTypeId: "pkg_456",
    })
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: sampleResult })
  })
})
