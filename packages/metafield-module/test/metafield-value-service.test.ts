import { describe, expect, it, vi } from "vitest"

import MetafieldModuleService from "../src/modules/metafield/service"
import type { MetafieldDefinitionRecord } from "../src/modules/metafield/types"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01KG0VBTT0714XV2CCTEBRVC48"

const DEFINITION: MetafieldDefinitionRecord = {
  id: "mfd_1",
  store_id: STORE_A,
  owner_type: "product",
  namespace: "custom",
  key: "spf_level",
  name: "SPF Level",
  description: null,
  type: "number_integer",
  validations: null,
  pinned_position: null,
  is_required: false,
  is_primary: false,
  category_constraint_id: null,
  is_standard: false,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
}

describe("MetafieldModuleService values", (): void => {
  it("listValues returns typed number values with definition metadata", async (): Promise<void> => {
    const valueRow = {
      id: "mfv_1",
      store_id: STORE_A,
      definition_id: DEFINITION.id,
      owner_id: "prod_1",
      owner_type: "product",
      value_text: null,
      value_json: null,
      value_number: 30,
      value_boolean: null,
      locale: "en",
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      raw_value_number: { value: "30", precision: 20 },
    }

    const withTenant = vi.fn(
      async <T>(
        _storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => fn({ transactionManager: {} })
    )
    const listMetafieldValues = vi.fn(async () => [valueRow])
    const listMetafieldDefinitions = vi.fn(async () => [DEFINITION])

    vi.spyOn(MetafieldModuleService.prototype, "listMetafieldValues").mockImplementation(
      listMetafieldValues as unknown as MetafieldModuleService["listMetafieldValues"]
    )
    vi.spyOn(MetafieldModuleService.prototype, "listMetafieldDefinitions").mockImplementation(
      listMetafieldDefinitions as unknown as MetafieldModuleService["listMetafieldDefinitions"]
    )

    const svc = Object.create(MetafieldModuleService.prototype) as MetafieldModuleService
    Object.assign(svc, { withTenant })

    const result = await svc.listValues(STORE_A, {
      ownerType: "product",
      ownerId: "prod_1",
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.value).toBe(30)
    expect(typeof result[0]?.value).toBe("number")
    expect(result[0]?.namespace).toBe("custom")
    expect(result[0]?.key).toBe("spf_level")
  })

  it("withTenant scopes calls per store for tenant isolation", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(
        storeId: string,
        fn: (context: { transactionManager: unknown }) => Promise<T>
      ): Promise<T> => {
        expect(storeId).toBe(STORE_B)
        return fn({ transactionManager: {} })
      }
    )
    const listMetafieldValues = vi.fn(async () => [])

    vi.spyOn(MetafieldModuleService.prototype, "listMetafieldValues").mockImplementation(
      listMetafieldValues as unknown as MetafieldModuleService["listMetafieldValues"]
    )

    const svc = Object.create(MetafieldModuleService.prototype) as MetafieldModuleService
    Object.assign(svc, { withTenant })

    const result = await svc.listValues(STORE_B, {
      ownerType: "product",
      ownerId: "prod_1",
    })

    expect(withTenant).toHaveBeenCalledWith(STORE_B, expect.any(Function))
    expect(result).toEqual([])
  })
})
