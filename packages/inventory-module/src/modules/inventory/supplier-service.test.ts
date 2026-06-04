import { describe, expect, it, vi } from "vitest"

import InventoryModuleService from "./service"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("InventoryModuleService suppliers", (): void => {
  it("listSuppliers filters by store_id inside withTenant", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMercflowSuppliers = vi.fn().mockResolvedValue([
      {
        id: "sup_1",
        store_id: STORE_A,
        name: "Acme",
        contact_person: null,
        email: null,
        country: "DK",
        currency: "DKK",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ])

    const svc = Object.create(InventoryModuleService.prototype) as InventoryModuleService
    Object.assign(svc, { withTenant, listMercflowSuppliers })

    const rows = await svc.listSuppliers(STORE_A)

    expect(withTenant).toHaveBeenCalledWith(STORE_A, expect.any(Function))
    expect(listMercflowSuppliers).toHaveBeenCalledWith(
      { store_id: STORE_A },
      { order: { name: "ASC" } },
      expect.any(Object)
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.name).toBe("Acme")
  })
})
