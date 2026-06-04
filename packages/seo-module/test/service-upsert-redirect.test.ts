import { describe, expect, it, vi } from "vitest"

import SeoModuleService from "../src/modules/seo/service"

const STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("SeoModuleService.upsertRedirect", (): void => {
  it("updates destination when from_path already exists", async (): Promise<void> => {
    const existing = {
      id: "red_existing",
      store_id: STORE_ID,
      from_path: "/old-product",
      to_path: "/was-b",
      type: "auto" as const,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }

    const findRedirectByFromPath = vi.fn().mockResolvedValue(existing)
    const withTenant = vi.fn(
      async <T>(_storeId: string, fn: () => Promise<T>): Promise<T> => fn()
    )
    const updateMercflowRedirects = vi.fn().mockResolvedValue({
      ...existing,
      to_path: "/now-c",
    })

    const svc = Object.create(SeoModuleService.prototype) as SeoModuleService
    Object.assign(svc, {
      findRedirectByFromPath,
      withTenant,
      updateMercflowRedirects,
      toRedirectRecord: (row: Record<string, unknown>) => ({
        id: String(row.id),
        store_id: String(row.store_id),
        from_path: String(row.from_path),
        to_path: String(row.to_path),
        type: row.type === "auto" ? "auto" : "manual",
        created_at: row.created_at as Date,
        updated_at: row.updated_at as Date,
        deleted_at: null,
      }),
    })

    const result = await svc.upsertRedirect(STORE_ID, {
      from_path: "/old-product",
      to_path: "/now-c",
      type: "auto",
    })

    expect(findRedirectByFromPath).toHaveBeenCalledWith(STORE_ID, "/old-product")
    expect(updateMercflowRedirects).toHaveBeenCalled()
    expect(result.to_path).toBe("/now-c")
  })
})
