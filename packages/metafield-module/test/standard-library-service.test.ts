import { describe, expect, it, vi } from "vitest"

import MetafieldModuleService from "../src/modules/metafield/service"
import {
  METAFIELD_ACTIVATED_NAMESPACE,
  METAFIELD_LIBRARY_NAMESPACE,
  STANDARD_LIBRARY_SEEDS,
} from "../src/modules/metafield/standard-library-seeds"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01OTHER0000000000000000001"

function libraryRow(seedId: string) {
  const seed = STANDARD_LIBRARY_SEEDS.find((row) => row.id === seedId)
  if (!seed) {
    throw new Error(`Missing seed fixture ${seedId}`)
  }
  return {
    id: seed.id,
    store_id: null,
    owner_type: seed.owner_type,
    namespace: METAFIELD_LIBRARY_NAMESPACE,
    key: seed.key,
    name: seed.name,
    description: seed.description,
    type: seed.type,
    validations: { vertical: seed.vertical },
    pinned_position: seed.pinned_position,
    is_required: false,
    is_primary: seed.is_primary,
    category_constraint_id: null,
    is_standard: true,
    created_at: new Date("2026-06-10T12:00:00.000Z"),
    updated_at: new Date("2026-06-10T12:00:00.000Z"),
    deleted_at: null,
  }
}

function tenantCopyFromSeed(
  storeId: string,
  seedId: string,
  id = `mfd_tenant_${seedId}`
) {
  const seed = libraryRow(seedId)
  return {
    ...seed,
    id,
    store_id: storeId,
    namespace: METAFIELD_ACTIVATED_NAMESPACE,
    is_standard: false,
  }
}

describe("MetafieldModuleService standard library", (): void => {
  it("listStandardLibrary returns only seeds for the requested vertical", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMetafieldDefinitions = vi.fn(async () => [
      libraryRow("mfd_lib_skincare_material"),
      libraryRow("mfd_lib_fashion_material"),
      libraryRow("mfd_lib_skincare_spf_level"),
    ])

    const svc = Object.create(MetafieldModuleService.prototype) as MetafieldModuleService
    Object.assign(svc, { withTenant, listMetafieldDefinitions })

    const result = await svc.listStandardLibrary({
      vertical: "skincare",
      storeId: STORE_A,
    })

    expect(withTenant).toHaveBeenCalledWith(STORE_A, expect.any(Function))
    expect(listMetafieldDefinitions).toHaveBeenCalledWith(
      {
        store_id: null,
        is_standard: true,
        namespace: METAFIELD_LIBRARY_NAMESPACE,
      },
      expect.objectContaining({ order: { pinned_position: "ASC", name: "ASC" } }),
      expect.any(Object)
    )
    expect(result.definitions).toHaveLength(2)
    expect(result.count).toBe(2)
  })

  it("activateStandardDefinitions copies library rows as tenant-owned mercflow_standard defs", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMetafieldDefinitions = vi
      .fn()
      .mockResolvedValueOnce([libraryRow("mfd_lib_skincare_material")])
      .mockResolvedValueOnce([])
    const createMetafieldDefinitions = vi.fn(async () =>
      tenantCopyFromSeed(STORE_A, "mfd_lib_skincare_material", "mfd_new_1")
    )

    const svc = Object.create(MetafieldModuleService.prototype) as MetafieldModuleService
    Object.assign(svc, { withTenant, listMetafieldDefinitions, createMetafieldDefinitions })

    const result = await svc.activateStandardDefinitions(STORE_A, {
      vertical: "skincare",
      definitionIds: ["mfd_lib_skincare_material"],
    })

    expect(createMetafieldDefinitions).toHaveBeenCalledWith(
      expect.objectContaining({
        store_id: STORE_A,
        namespace: METAFIELD_ACTIVATED_NAMESPACE,
        key: "material",
        is_standard: false,
        is_primary: true,
      }),
      expect.any(Object)
    )
    expect(result.activated).toHaveLength(1)
    expect(result.activated[0]?.store_id).toBe(STORE_A)
    expect(result.skipped_keys).toHaveLength(0)
  })

  it("activateStandardDefinitions skips keys already owned by the tenant", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMetafieldDefinitions = vi
      .fn()
      .mockResolvedValueOnce([libraryRow("mfd_lib_skincare_material")])
      .mockResolvedValueOnce([
        tenantCopyFromSeed(STORE_A, "mfd_lib_skincare_material", "mfd_existing"),
      ])
    const createMetafieldDefinitions = vi.fn()

    const svc = Object.create(MetafieldModuleService.prototype) as MetafieldModuleService
    Object.assign(svc, { withTenant, listMetafieldDefinitions, createMetafieldDefinitions })

    const result = await svc.activateStandardDefinitions(STORE_A, {
      vertical: "skincare",
    })

    expect(createMetafieldDefinitions).not.toHaveBeenCalled()
    expect(result.activated).toHaveLength(0)
    expect(result.skipped_keys).toEqual(["material"])
  })

  it("activated tenant copies remain scoped to the requesting store", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listAndCountMetafieldDefinitions = vi.fn(async (query: Record<string, unknown>) => {
      if (query.store_id === STORE_B) {
        return [[tenantCopyFromSeed(STORE_B, "mfd_lib_skincare_material", "mfd_store_b")], 1] as [
          unknown[],
          number,
        ]
      }
      return [[], 0] as [unknown[], number]
    })

    const svc = Object.create(MetafieldModuleService.prototype) as MetafieldModuleService
    Object.assign(svc, { withTenant, listAndCountMetafieldDefinitions })

    const result = await svc.listDefinitions({
      ownerType: "product",
      storeId: STORE_B,
    })

    expect(withTenant).toHaveBeenCalledWith(STORE_B, expect.any(Function))
    expect(listAndCountMetafieldDefinitions).toHaveBeenCalledWith(
      expect.objectContaining({ store_id: STORE_B }),
      expect.any(Object),
      expect.any(Object)
    )
    expect(result.definitions[0]?.store_id).toBe(STORE_B)
    expect(result.definitions[0]?.namespace).toBe(METAFIELD_ACTIVATED_NAMESPACE)
  })
})
