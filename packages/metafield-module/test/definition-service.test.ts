import { describe, expect, it, vi } from "vitest"

import MetafieldModuleService from "../src/modules/metafield/service"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01OTHER0000000000000000001"

function sampleDefinition(storeId: string, id = "mfd_1") {
  return {
    id,
    store_id: storeId,
    owner_type: "product" as const,
    namespace: "custom",
    key: "active_ingredients",
    name: "Active ingredients",
    description: null,
    type: "multi_line_text" as const,
    validations: null,
    pinned_position: null,
    is_required: false,
    is_primary: false,
    category_constraint_id: null,
    is_standard: false,
    created_at: new Date("2026-06-10T12:00:00.000Z"),
    updated_at: new Date("2026-06-10T12:00:00.000Z"),
    deleted_at: null,
  }
}

describe("MetafieldModuleService definitions", (): void => {
  it("createDefinition persists tenant-scoped row", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const createMetafieldDefinitions = vi.fn(async () => sampleDefinition(STORE_A))

    const svc = Object.create(MetafieldModuleService.prototype) as MetafieldModuleService
    Object.assign(svc, { withTenant, createMetafieldDefinitions })

    const result = await svc.createDefinition(STORE_A, {
      owner_type: "product",
      namespace: "custom",
      key: "active_ingredients",
      name: "Active ingredients",
      type: "multi_line_text",
    })

    expect(withTenant).toHaveBeenCalledWith(STORE_A, expect.any(Function))
    expect(createMetafieldDefinitions).toHaveBeenCalledWith(
      expect.objectContaining({
        store_id: STORE_A,
        owner_type: "product",
        namespace: "custom",
        key: "active_ingredients",
        is_standard: false,
      }),
      expect.any(Object)
    )
    expect(result.key).toBe("active_ingredients")
  })

  it("listDefinitions filters by store_id for tenant isolation", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listAndCountMetafieldDefinitions = vi.fn(async () => [[], 0] as [unknown[], number])

    vi.spyOn(
      MetafieldModuleService.prototype,
      "listAndCountMetafieldDefinitions"
    ).mockImplementation(
      listAndCountMetafieldDefinitions as MetafieldModuleService["listAndCountMetafieldDefinitions"]
    )

    const svc = Object.create(MetafieldModuleService.prototype) as MetafieldModuleService
    Object.assign(svc, { withTenant })

    const result = await svc.listDefinitions({
      ownerType: "product",
      storeId: STORE_B,
      limit: 50,
      offset: 0,
    })

    expect(withTenant).toHaveBeenCalledWith(STORE_B, expect.any(Function))
    expect(listAndCountMetafieldDefinitions).toHaveBeenCalledWith(
      { store_id: STORE_B, owner_type: "product" },
      expect.objectContaining({ take: 50, skip: 0 }),
      expect.any(Object)
    )
    expect(result.definitions).toHaveLength(0)
    expect(result.count).toBe(0)
  })

  it("createDefinition maps unique constraint errors to DUPLICATE_ERROR", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const createMetafieldDefinitions = vi.fn(async () => {
      throw new Error("duplicate key value violates unique constraint IDX_metafield_definitions_store_owner_ns_key")
    })

    const svc = Object.create(MetafieldModuleService.prototype) as MetafieldModuleService
    Object.assign(svc, { withTenant, createMetafieldDefinitions })

    await expect(
      svc.createDefinition(STORE_A, {
        owner_type: "product",
        namespace: "custom",
        key: "dup",
        name: "Dup",
        type: "single_line_text",
      })
    ).rejects.toMatchObject({ type: "duplicate_error" })
  })
})
