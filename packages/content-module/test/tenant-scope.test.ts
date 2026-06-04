import { describe, expect, it, vi } from "vitest"
import { MedusaError } from "@medusajs/utils"

import {
  assertMedusaStoreId,
  runWithTenantScope,
  setLocalAppStoreId,
} from "../src/modules/content/tenant-scope"

const GUAPO_STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("tenant-scope", (): void => {
  it("accepts valid Medusa store ids", (): void => {
    expect(() => assertMedusaStoreId(GUAPO_STORE_ID)).not.toThrow()
  })

  it("rejects invalid store ids before SQL", (): void => {
    expect(() => assertMedusaStoreId("'; DROP TABLE article; --")).toThrow(MedusaError)
    expect(() => assertMedusaStoreId("")).toThrow(MedusaError)
  })

  it("setLocalAppStoreId uses parameterized set_config", async (): Promise<void> => {
    const execute = vi.fn().mockResolvedValue(undefined)
    await setLocalAppStoreId({ execute }, GUAPO_STORE_ID)
    expect(execute).toHaveBeenCalledWith(
      `SELECT set_config('app.store_id', ?, true)`,
      [GUAPO_STORE_ID]
    )
  })

  it("runWithTenantScope sets tenant then runs fn in one transaction", async (): Promise<void> => {
    let transactionInvoked = false
    const transaction = async <T>(
      task: (transactionManager: unknown) => Promise<T>
    ): Promise<T> => {
      transactionInvoked = true
      const execute = vi.fn().mockResolvedValue(undefined)
      return task({ execute })
    }
    const fn = vi.fn().mockResolvedValue("ok")

    const result = await runWithTenantScope({ transaction }, GUAPO_STORE_ID, fn)

    expect(result).toBe("ok")
    expect(transactionInvoked).toBe(true)
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({ transactionManager: expect.any(Object) })
    )
  })
})
