import { describe, expect, it, vi } from "vitest"

import InventoryModuleService from "./service"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("InventoryModuleService suppliers", (): void => {
  it("listSuppliers passes pagination to listAndCountMercflowSuppliers", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listAndCountMercflowSuppliers = vi.fn(async () => [
      [
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
      ],
      1,
    ] as [unknown[], number])

    vi.spyOn(InventoryModuleService.prototype, "listAndCountMercflowSuppliers").mockImplementation(
      listAndCountMercflowSuppliers as InventoryModuleService["listAndCountMercflowSuppliers"]
    )

    const svc = Object.create(InventoryModuleService.prototype) as InventoryModuleService
    Object.assign(svc, { withTenant })

    const result = await svc.listSuppliers(STORE_A, { limit: 50, offset: 0 })

    expect(withTenant).toHaveBeenCalledWith(STORE_A, expect.any(Function))
    expect(listAndCountMercflowSuppliers).toHaveBeenCalledWith(
      { store_id: STORE_A },
      { order: { name: "ASC" }, skip: 0, take: 50 },
      expect.any(Object)
    )
    expect(result.suppliers).toHaveLength(1)
    expect(result.count).toBe(1)
    expect(result.suppliers[0]?.name).toBe("Acme")
  })
})
