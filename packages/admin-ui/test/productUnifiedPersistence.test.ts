import type Medusa from "@medusajs/js-sdk"
import { describe, expect, it, vi } from "vitest"

import { persistUnifiedProductCreate, persistUnifiedProductUpdate } from "@/lib/products/productUnifiedPersistence"
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
          update: vi.fn().mockResolvedValue({}),
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
          shipping: { lengthMm: 300, widthMm: 200, heightMm: 100, weightG: 400 },
        },
        {
          comboKey: "",
          selections: { Size: "M", Color: "Red" },
          priceMinorUnits: 9950,
          stockQuantity: 6,
        },
      ],
      requiresShipping: true,
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

describe("persistUnifiedProductUpdate", (): void => {
  it("does not pass product-scoped fields to batchVariants (variant refetch crash)", async (): Promise<void> => {
    vi.resetAllMocks()

    const batchVariantsMock = vi.fn().mockResolvedValue({ product: { id: "prod_test_primary" } })

    const sdkMock = {
      admin: {
        product: {
          retrieve: vi.fn().mockResolvedValue({
            product: {
              id: "prod_test_primary",
              variants: [
                {
                  id: "variant_s",
                  options: [{ option: { title: "Size" }, value: "S" }],
                  inventory_items: [{ inventory_item_id: "iitem_s" }],
                },
              ],
            },
          }),
          update: vi.fn().mockResolvedValue({ product: { id: "prod_test_primary" } }),
          batchVariants: batchVariantsMock,
        },
        inventoryItem: {
          listLevels: vi.fn().mockResolvedValue({ inventory_levels: [] }),
          batchInventoryItemsLocationLevels: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
        },
      },
    } as unknown as Medusa

    await persistUnifiedProductUpdate({
      sdk: sdkMock,
      prerequisites: {
        shippingProfileId: "sp_test",
        primaryStockLocationId: "sl_test",
        primarySalesChannelId: null,
      },
      productId: "prod_test_primary",
      title: "Updated",
      description: "",
      status: "draft",
      categoryIds: [],
      optionRows: [{ medusaOptionId: "opt_size", title: "Size", values: ["S"] }],
      variants: [
        {
          comboKey: "Size=S",
          selections: { Size: "S" },
          priceMinorUnits: 14095,
          stockQuantity: 20,
          existingVariantId: "variant_s",
        },
      ],
      requiresShipping: true,
    })

    expect(batchVariantsMock).toHaveBeenCalledTimes(1)
    expect(batchVariantsMock.mock.calls[0]?.[2]).toBeUndefined()
  })
})
