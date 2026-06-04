import { afterEach, describe, expect, it, vi } from "vitest"
import type { MedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { resolveStoreIdFromPublishableKey } from "../src/api/http/resolve-store-id-from-publishable-key"
import { resolveStoreSeoStoreId } from "../src/api/http/resolve-store-seo-store-id"
import { clearTenantResolverCacheForTests } from "../src/modules/seo/tenant-resolver-cache"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const SC_A = "sc_01KG0VBTT0714XV2CCTEBRVC47"

function makeReq(overrides: Partial<MedusaRequest> = {}): MedusaRequest {
  return {
    headers: {},
    query: {},
    scope: {
      resolve: vi.fn(),
    },
    ...overrides,
  } as unknown as MedusaRequest
}

function mockPublishableQuery(storeId: string): ReturnType<typeof vi.fn> {
  const graph = vi.fn(async () => ({
    data: [{ store: { id: storeId } }],
  }))
  return graph
}

describe("resolveStoreIdFromPublishableKey", (): void => {
  it("returns store id from publishable key sales channels", async (): Promise<void> => {
    const graph = mockPublishableQuery(STORE_A)
    const req = makeReq({
      publishable_key_context: {
        key: "pk_test",
        sales_channel_ids: [SC_A],
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) {
            return { graph }
          }
          throw new Error(`unexpected resolve: ${key}`)
        }),
      },
    } as unknown as MedusaRequest)

    const storeId = await resolveStoreIdFromPublishableKey(req)
    expect(storeId).toBe(STORE_A)
    expect(graph).toHaveBeenCalled()
  })

  it("returns null when publishable context is missing", async (): Promise<void> => {
    const storeId = await resolveStoreIdFromPublishableKey(makeReq())
    expect(storeId).toBeNull()
  })
})

describe("resolveStoreSeoStoreId (tenant binding)", (): void => {
  const originalEnv = process.env.NODE_ENV
  const originalDefault = process.env.MERCFLOW_DEFAULT_STORE_ID
  const originalHostMap = process.env.MERCFLOW_HOST_MAP

  afterEach((): void => {
    clearTenantResolverCacheForTests()
    process.env.NODE_ENV = originalEnv
    if (originalDefault === undefined) {
      delete process.env.MERCFLOW_DEFAULT_STORE_ID
    } else {
      process.env.MERCFLOW_DEFAULT_STORE_ID = originalDefault
    }
    if (originalHostMap === undefined) {
      delete process.env.MERCFLOW_HOST_MAP
    } else {
      process.env.MERCFLOW_HOST_MAP = originalHostMap
    }
  })

  const lookup = {
    getStorefrontUrl: vi.fn(async (): Promise<string | null> => null),
  }

  it("binds tenant from publishable API key", async (): Promise<void> => {
    const graph = mockPublishableQuery(STORE_A)
    const req = makeReq({
      publishable_key_context: {
        key: "pk_test",
        sales_channel_ids: [SC_A],
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) {
            return { graph }
          }
          throw new Error(`unexpected resolve: ${key}`)
        }),
      },
    } as unknown as MedusaRequest)

    const storeId = await resolveStoreSeoStoreId(req, lookup)
    expect(storeId).toBe(STORE_A)
  })

  it("rejects mismatched client store_id query", async (): Promise<void> => {
    const graph = mockPublishableQuery(STORE_A)
    const req = makeReq({
      query: { store_id: STORE_B },
      publishable_key_context: {
        key: "pk_test",
        sales_channel_ids: [SC_A],
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) {
            return { graph }
          }
          throw new Error(`unexpected resolve: ${key}`)
        }),
      },
    } as unknown as MedusaRequest)

    await expect(resolveStoreSeoStoreId(req, lookup)).rejects.toMatchObject({
      type: MedusaError.Types.NOT_ALLOWED,
    })
  })

  it("rejects mismatched X-Store-Id header", async (): Promise<void> => {
    const graph = mockPublishableQuery(STORE_A)
    const req = makeReq({
      headers: { "x-store-id": STORE_B },
      publishable_key_context: {
        key: "pk_test",
        sales_channel_ids: [SC_A],
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) {
            return { graph }
          }
          throw new Error(`unexpected resolve: ${key}`)
        }),
      },
    } as unknown as MedusaRequest)

    await expect(resolveStoreSeoStoreId(req, lookup)).rejects.toMatchObject({
      type: MedusaError.Types.NOT_ALLOWED,
    })
  })

  it("accepts matching client store_id hint", async (): Promise<void> => {
    const graph = mockPublishableQuery(STORE_A)
    const req = makeReq({
      query: { store_id: STORE_A },
      publishable_key_context: {
        key: "pk_test",
        sales_channel_ids: [SC_A],
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) {
            return { graph }
          }
          throw new Error(`unexpected resolve: ${key}`)
        }),
      },
    } as unknown as MedusaRequest)

    const storeId = await resolveStoreSeoStoreId(req, lookup)
    expect(storeId).toBe(STORE_A)
  })

  it("rejects when publishable store and host tenant disagree", async (): Promise<void> => {
    process.env.MERCFLOW_HOST_MAP = JSON.stringify({ "shop-b.example": STORE_B })
    const graph = mockPublishableQuery(STORE_A)
    const req = makeReq({
      headers: { host: "shop-b.example" },
      publishable_key_context: {
        key: "pk_test",
        sales_channel_ids: [SC_A],
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) {
            return { graph }
          }
          throw new Error(`unexpected resolve: ${key}`)
        }),
      },
    } as unknown as MedusaRequest)

    await expect(resolveStoreSeoStoreId(req, lookup)).rejects.toMatchObject({
      type: MedusaError.Types.NOT_ALLOWED,
    })
  })

  it("resolves from host when publishable context is absent", async (): Promise<void> => {
    process.env.MERCFLOW_HOST_MAP = JSON.stringify({ "shop-a.example": STORE_A })
    const req = makeReq({
      headers: { host: "shop-a.example" },
    })

    const storeId = await resolveStoreSeoStoreId(req, lookup)
    expect(storeId).toBe(STORE_A)
  })

  it("fails closed without publishable key or host mapping", async (): Promise<void> => {
    delete process.env.MERCFLOW_HOST_MAP
    delete process.env.MERCFLOW_DEFAULT_STORE_ID
    process.env.NODE_ENV = "production"

    const req = makeReq()
    await expect(resolveStoreSeoStoreId(req, lookup)).rejects.toMatchObject({
      type: MedusaError.Types.NOT_ALLOWED,
    })
  })
})
