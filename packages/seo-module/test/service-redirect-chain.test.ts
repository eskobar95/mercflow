import { describe, expect, it, vi } from "vitest"

import SeoModuleService from "../src/modules/seo/service"

const STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("SeoModuleService.redirectHasChainIssue", (): void => {
  it("returns true when destination path is another redirect source", async (): Promise<void> => {
    const findRedirectByFromPath = vi.fn().mockResolvedValueOnce({
        id: "red_2",
        store_id: STORE_ID,
        from_path: "/new",
        to_path: "/final",
        type: "manual",
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      })

    const svc = Object.create(SeoModuleService.prototype) as SeoModuleService
    Object.assign(svc, { findRedirectByFromPath })

    const hasChain = await svc.redirectHasChainIssue(STORE_ID, {
      id: "red_1",
      store_id: STORE_ID,
      from_path: "/old",
      to_path: "/new",
      type: "manual",
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    })

    expect(hasChain).toBe(true)
    expect(findRedirectByFromPath).toHaveBeenCalledWith(STORE_ID, "/new")
  })
})
