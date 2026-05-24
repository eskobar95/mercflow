import { afterEach, describe, expect, it, vi } from "vitest"

import { createAdminProductCategory, updateAdminProductCategory } from "./productCategoriesAdminApi"

vi.mock("@/medusa-admin/medusaAdminFetch", (): typeof import("@/medusa-admin/medusaAdminFetch") => ({
  resolveMedusaAdminBackendUrl: (): string => "http://localhost:9000",
  buildMedusaAdminJsonHeaders: (): HeadersInit => ({
    "Content-Type": "application/json",
  }),
  readMedusaAdminHttpErrorMessage: async (): Promise<string> => "error",
  formatMedusaAdminHttpErrorMessageFromText: (...args: Parameters<typeof import("@/medusa-admin/medusaAdminFetch").formatMedusaAdminHttpErrorMessageFromText>): string =>
    args[0],
  parseMedusaAdminJsonResponse: async (response: Response): Promise<unknown> => {
    const text = await response.text()
    return JSON.parse(text) as unknown
  },
}))

describe("createAdminProductCategory", (): void => {
  afterEach((): void => {
    vi.restoreAllMocks()
  })

  it("POSTs name, handle, is_active, and parent_category_id", async (): Promise<void> => {
    const bodyFromServer = {
      id: "pcat_test",
      name: "Tops",
      handle: "tops",
      description: null,
      parent_category_id: "pcat_parent",
      is_active: true,
      rank: 0,
      created_at: "2020-01-01T00:00:00.000Z",
      updated_at: "2020-01-01T00:00:00.000Z",
      products: [],
    }

    const fetchMock = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ product_category: bodyFromServer }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    )
    vi.stubGlobal("fetch", fetchMock)

    await createAdminProductCategory({
      name: "Tops",
      handle: "tops",
      is_active: true,
      parent_category_id: "pcat_parent",
    })

    expect(fetchMock).toHaveBeenCalled()
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.method).toBe("POST")
    const parsed: unknown = JSON.parse(String(init.body))
    expect(parsed).toMatchObject({
      name: "Tops",
      handle: "tops",
      is_active: true,
      parent_category_id: "pcat_parent",
    })
  })

  it("omits parent_category_id key for top-level categories", async (): Promise<void> => {
    const bodyFromServer = {
      id: "pcat_rootish",
      name: "Rootish",
      handle: "rootish",
      description: null,
      parent_category_id: null,
      is_active: false,
      rank: null,
      created_at: "2020-01-01T00:00:00.000Z",
      updated_at: "2020-01-01T00:00:00.000Z",
      products: [],
    }

    const fetchMock = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ product_category: bodyFromServer }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    )
    vi.stubGlobal("fetch", fetchMock)

    await createAdminProductCategory({
      name: "Rootish",
      handle: "rootish",
      is_active: false,
      parent_category_id: null,
    })

    expect(fetchMock).toHaveBeenCalled()
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const parsed: Record<string, unknown> = JSON.parse(String(init.body)) as Record<
      string,
      unknown
    >
    expect(parsed).toMatchObject({
      name: "Rootish",
      handle: "rootish",
      is_active: false,
    })
    expect("parent_category_id" in parsed).toBe(false)
  })
})

describe("updateAdminProductCategory", (): void => {
  afterEach((): void => {
    vi.restoreAllMocks()
  })

  it("issues POST with only provided fields", async (): Promise<void> => {
    const bodyFromServer = {
      id: "pcat_test",
      name: "Tops",
      handle: "tops",
      description: null,
      parent_category_id: null,
      is_active: true,
      rank: 0,
      created_at: "2020-01-01T00:00:00.000Z",
      updated_at: "2020-01-01T00:00:00.000Z",
      products: [],
    }

    const fetchMock = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ product_category: bodyFromServer }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
    )
    vi.stubGlobal("fetch", fetchMock)

    await updateAdminProductCategory("pcat_test", { name: "Coats" })

    expect(fetchMock).toHaveBeenCalled()
    const tuple = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const [url, init] = tuple
    expect(String(url)).toContain("/admin/product-categories/pcat_test")
    expect(init.method).toBe("POST")
    const parsed: unknown = JSON.parse(String(init.body))
    expect(parsed).toEqual({ name: "Coats" })
  })
})
