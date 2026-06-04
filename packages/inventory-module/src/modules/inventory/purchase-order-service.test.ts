import { describe, expect, it, vi } from "vitest"

import InventoryModuleService from "./service"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("InventoryModuleService purchase orders", (): void => {
  it("updatePurchaseOrderStatus allows draft to ordered", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMercflowPurchaseOrders = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "po_1",
          store_id: STORE_A,
          supplier_id: "sup_1",
          status: "draft",
          expected_date: null,
          reference: null,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
        },
      ])
    const updateMercflowPurchaseOrders = vi.fn().mockResolvedValue([
      {
        id: "po_1",
        store_id: STORE_A,
        supplier_id: "sup_1",
        status: "ordered",
        expected_date: null,
        reference: null,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ])

    const svc = Object.create(InventoryModuleService.prototype) as InventoryModuleService
    Object.assign(svc, {
      withTenant,
      listMercflowPurchaseOrders,
      updateMercflowPurchaseOrders,
    })

    const row = await svc.updatePurchaseOrderStatus(STORE_A, "po_1", "ordered")

    expect(row.status).toBe("ordered")
    expect(updateMercflowPurchaseOrders).toHaveBeenCalledWith(
      { id: "po_1", store_id: STORE_A },
      { status: "ordered" },
      expect.any(Object)
    )
  })
})
