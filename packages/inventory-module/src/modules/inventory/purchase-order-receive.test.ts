import { describe, expect, it, vi } from "vitest"

import InventoryModuleService from "./service"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

const ORDERED_PO = {
  id: "po_1",
  store_id: STORE_A,
  supplier_id: "sup_1",
  status: "ordered" as const,
  expected_date: null,
  reference: null,
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
}

const LINE_A = {
  id: "line_a",
  store_id: STORE_A,
  po_id: "po_1",
  variant_id: "variant_a",
  ordered_qty: 100,
  unit_cost: 10,
  created_at: new Date(),
  updated_at: new Date(),
}

const LINE_B = {
  id: "line_b",
  store_id: STORE_A,
  po_id: "po_1",
  variant_id: "variant_b",
  ordered_qty: 50,
  unit_cost: 5,
  created_at: new Date(),
  updated_at: new Date(),
}

describe("InventoryModuleService receive purchase order", (): void => {
  it("partial receive sets partially_received and exposes discrepancy", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMercflowPurchaseOrders = vi.fn().mockResolvedValue([ORDERED_PO])
    const listMercflowPurchaseOrderLines = vi.fn().mockResolvedValue([LINE_A, LINE_B])
    const listMercflowPurchaseOrderReceipts = vi.fn().mockResolvedValue([
      {
        id: "rcpt_1",
        store_id: STORE_A,
        line_id: "line_a",
        received_qty: 94,
        received_at: new Date(),
        notes: null,
      },
    ])
    const createMercflowPurchaseOrderReceipts = vi.fn().mockResolvedValue([
      {
        id: "rcpt_1",
        store_id: STORE_A,
        line_id: "line_a",
        received_qty: 94,
        received_at: new Date(),
        notes: null,
      },
    ])
    const updateMercflowPurchaseOrders = vi.fn().mockResolvedValue([
      { ...ORDERED_PO, status: "partially_received" },
    ])

    const svc = Object.create(InventoryModuleService.prototype) as InventoryModuleService
    Object.assign(svc, {
      withTenant,
      listMercflowPurchaseOrders,
      listMercflowPurchaseOrderLines,
      listMercflowPurchaseOrderReceipts,
      createMercflowPurchaseOrderReceipts,
      updateMercflowPurchaseOrders,
    })

    const detail = await svc.receivePurchaseOrder(STORE_A, "po_1", {
      lines: [{ line_id: "line_a", received_qty: 94 }],
    })

    expect(detail.stock_applied).toBe(false)
    expect(detail.purchase_order.status).toBe("partially_received")
    const lineA = detail.lines.find((line) => line.id === "line_a")
    expect(lineA?.received_total).toBe(94)
    expect(lineA?.discrepancy).toBe(6)
    expect(createMercflowPurchaseOrderReceipts).toHaveBeenCalledTimes(1)
  })

  it("full receive on all lines sets received", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMercflowPurchaseOrders = vi.fn().mockResolvedValue([ORDERED_PO])
    const listMercflowPurchaseOrderLines = vi.fn().mockResolvedValue([LINE_A])
    const listMercflowPurchaseOrderReceipts = vi.fn().mockResolvedValue([
      {
        id: "rcpt_1",
        store_id: STORE_A,
        line_id: "line_a",
        received_qty: 100,
        received_at: new Date(),
        notes: null,
      },
    ])
    const createMercflowPurchaseOrderReceipts = vi.fn().mockResolvedValue([])
    const updateMercflowPurchaseOrders = vi.fn().mockResolvedValue([
      { ...ORDERED_PO, status: "received" },
    ])

    const svc = Object.create(InventoryModuleService.prototype) as InventoryModuleService
    Object.assign(svc, {
      withTenant,
      listMercflowPurchaseOrders,
      listMercflowPurchaseOrderLines,
      listMercflowPurchaseOrderReceipts,
      createMercflowPurchaseOrderReceipts,
      updateMercflowPurchaseOrders,
    })

    const detail = await svc.receivePurchaseOrder(STORE_A, "po_1", {
      lines: [{ line_id: "line_a", received_qty: 100 }],
    })

    expect(detail.purchase_order.status).toBe("received")
    expect(detail.lines[0]?.discrepancy).toBe(0)
  })
})
