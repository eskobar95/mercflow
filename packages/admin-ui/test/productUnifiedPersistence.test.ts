import type Medusa from "@medusajs/js-sdk"
import { describe, expect, it, vi } from "vitest"

import { persistUnifiedProductCreate } from "@/lib/products/productUnifiedPersistence"
describe("persistUnifiedProductCreate", (): void => {
  it("submits catalogue rows then writes inventory batches", async (): Promise<void> => {
    vi.resetAllMocks()

    const capturedBatchPayload = vi.fn()
    const retrievedVariantId = "variant_test_123"

    const createProductMock = vi.fn().mockResolvedValue({
      product: { id: "prod_test_primary" },
    })

    const sdkMock = {
      admin: {
        product: {
          create: createProductMock,
          retrieve: vi.fn().mockResolvedValue({
            product: {
              id: "prod_test_primary",
              variants: [
                {
                  id: retrievedVariantId,
                  options: [
                    { option: { title: "Size" }, value: "S" },
                    { option: { title: "Color" }, value: "Red" },
                  ],
                  inventory_items: [{ inventory_item_id: "inventory_item_fixture" }],
                },
                {
                  id: `${retrievedVariantId}_2`,
                  options: [
                    { option: { title: "Size" }, value: "M" },
                    { option: { title: "Color" }, value: "Red" },
                  ],
                  inventory_items: [{ inventory_item_id: "inventory_item_fixture_2" }],
                },
              ],
            },
          }),
        },
        inventoryItem: {
          listLevels: vi.fn().mockResolvedValue({
            inventory_levels: [],
          }),
          batchInventoryItemsLocationLevels: capturedBatchPayload.mockResolvedValue({}),
        },
      },
    } as unknown as Medusa

    const { productId } = await persistUnifiedProductCreate({
      sdk: sdkMock,
      prerequisites: {
        shippingProfileId: "sp_test",
        primaryStockLocationId: "sl_test",
        primarySalesChannelId: "sc_test",
      },
      title: "Test sweatshirt",
      description: "",
      status: "draft",
      categoryIds: [],
      optionRows: [
        {
          title: "Size",
          values: ["S", "M"],
        },
        {
          title: "Color",
          values: ["Red"],
        },
      ],
      variants: [
        {
          comboKey: "",
          selections: { Size: "S", Color: "Red" },
          priceMinorUnits: 9900,
          stockQuantity: 4,
        },
        {
          comboKey: "",
          selections: { Size: "M", Color: "Red" },
          priceMinorUnits: 9950,
          stockQuantity: 6,
        },
      ],
    })

    expect(productId).toBe("prod_test_primary")

    const createCall = createProductMock.mock.calls[0]
    expect(createCall).toBeDefined()

    const [createBody] = createCall as [{ variants?: unknown[] }]
    expect(Array.isArray(createBody.variants)).toBe(true)
    expect(createBody.variants ?? []).toHaveLength(2)

    expect(capturedBatchPayload).toHaveBeenCalledTimes(2)
  })
})
