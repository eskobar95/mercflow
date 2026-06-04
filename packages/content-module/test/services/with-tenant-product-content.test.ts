import { describe, expect, it, vi } from "vitest"

import ContentModuleService from "../../src/modules/content/service"

const GUAPO_STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("ContentModuleService.withTenant", (): void => {
  it("retrieveProductContentForLocale uses withTenant when storeId is provided", async (): Promise<void> => {
    const withTenant = vi.fn(
      async <T>(_storeId: string, fn: () => Promise<T>): Promise<T> => fn()
    )
    const listProductContents = vi.fn().mockResolvedValue([])

    const svc = Object.create(ContentModuleService.prototype) as ContentModuleService
    Object.assign(svc, {
      withTenant,
      listProductContents,
      resolveProductRow: vi.fn(),
    })

    await svc.retrieveProductContentForLocale("prod_1", "en", {
      storeId: GUAPO_STORE_ID,
    })

    expect(withTenant).toHaveBeenCalledTimes(1)
    expect(withTenant).toHaveBeenCalledWith(GUAPO_STORE_ID, expect.any(Function))
    expect(listProductContents).toHaveBeenCalled()
  })
})
