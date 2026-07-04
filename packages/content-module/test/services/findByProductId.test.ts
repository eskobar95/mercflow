import { describe, expect, it, vi } from "vitest"

import ContentModuleService from "../../src/modules/content/service"

describe("ContentModuleService.findByProductId", () => {
  it("delegates to retrieveProductContentForLocale", async () => {
    const spy = vi
      .spyOn(ContentModuleService.prototype, "retrieveProductContentForLocale")
      .mockResolvedValue(null)

    const svc = Object.create(ContentModuleService.prototype) as ContentModuleService
    await svc.findByProductId("prod_abc", "da", "store_test")

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith("prod_abc", "da", { storeId: "store_test" })
    spy.mockRestore()
  })
})
