import { describe, expect, it, vi } from "vitest"

import ContentModuleService from "../../src/modules/content/service"

describe("ContentModuleService.findByCategoryId", () => {
  it("delegates to retrieveCategoryContentForLocale", async () => {
    const spy = vi
      .spyOn(ContentModuleService.prototype, "retrieveCategoryContentForLocale")
      .mockResolvedValue(null)

    const svc = Object.create(ContentModuleService.prototype) as ContentModuleService
    await svc.findByCategoryId("pcat_xyz", "da", "store_test")

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith("pcat_xyz", "da", { storeId: "store_test" })
    spy.mockRestore()
  })
})
