import { afterEach, describe, expect, it, vi } from "vitest"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { resolveStoreIdFromPublishableKey } from "../src/api/http/resolve-store-id-from-publishable-key"
import { resolveStoreMetafieldStoreId } from "../src/api/http/resolve-store-metafield-store-id"
import { GET } from "../src/api/store/metafields/route"
import { METAFIELD_MODULE } from "../src/modules/metafield"
import type { MetafieldValueListItem } from "../src/modules/metafield/types"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01KG0VBTT0714XV2CCTEBRVC48"
const SC_A = "sc_01KG0VBTT0714XV2CCTEBRVC47"
const SC_B = "sc_01KG0VBTT0714XV2CCTEBRVC48"
const OWNER_ID = "prod_cross_tenant_probe"

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
  return vi.fn(async () => ({
    data: [{ store: { id: storeId } }],
  }))
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
  })

  it("returns null when publishable context is missing", async (): Promise<void> => {
    const storeId = await resolveStoreIdFromPublishableKey(makeReq())
    expect(storeId).toBeNull()
  })
})

describe("resolveStoreMetafieldStoreId", (): void => {
  const originalEnv = process.env.NODE_ENV
  const originalDefault = process.env.MERCFLOW_DEFAULT_STORE_ID

  afterEach((): void => {
    process.env.NODE_ENV = originalEnv
    if (originalDefault === undefined) {
      delete process.env.MERCFLOW_DEFAULT_STORE_ID
    } else {
      process.env.MERCFLOW_DEFAULT_STORE_ID = originalDefault
    }
  })

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

    const storeId = await resolveStoreMetafieldStoreId(req)
    expect(storeId).toBe(STORE_A)
  })

  it("fails closed without publishable key in production", async (): Promise<void> => {
    delete process.env.MERCFLOW_DEFAULT_STORE_ID
    process.env.NODE_ENV = "production"

    await expect(resolveStoreMetafieldStoreId(makeReq())).rejects.toMatchObject({
      type: MedusaError.Types.NOT_ALLOWED,
    })
  })
})

describe("GET /store/metafields (cross-tenant isolation)", (): void => {
  const storeAValues: MetafieldValueListItem[] = [
    {
      id: "mfv_1",
      namespace: "custom",
      key: "active_ingredients",
      name: "Active ingredients",
      type: "multi_line_text",
      value: "Niacinamide 10%, Zinc 1%",
      locale: "en",
    },
  ]

  function makeRouteReq(storeId: string, salesChannelId: string): MedusaRequest {
    const listValues = vi.fn(async (resolvedStoreId: string) => {
      if (resolvedStoreId === STORE_A) {
        return storeAValues
      }
      return []
    })

    const graph = mockPublishableQuery(storeId)
    return makeReq({
      query: {
        owner_type: "product",
        owner_id: OWNER_ID,
      },
      publishable_key_context: {
        key: `pk_${storeId}`,
        sales_channel_ids: [salesChannelId],
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) {
            return { graph }
          }
          if (key === METAFIELD_MODULE) {
            return { listValues }
          }
          throw new Error(`unexpected resolve: ${key}`)
        }),
      },
    } as unknown as MedusaRequest)
  }

  it("returns typed metafields for the authenticated tenant", async (): Promise<void> => {
    const req = makeRouteReq(STORE_A, SC_A)
    const json = vi.fn()
    const res = { status: vi.fn(() => ({ json })) } as unknown as MedusaResponse

    await GET(req, res)

    expect(json).toHaveBeenCalledWith({
      metafields: [
        {
          namespace: "custom",
          key: "active_ingredients",
          value: "Niacinamide 10%, Zinc 1%",
          type: "multi_line_text",
        },
      ],
      count: 1,
    })
  })

  it("returns zero metafields for probe tenant on same owner_id (no cross-tenant leakage)", async (): Promise<void> => {
    const req = makeRouteReq(STORE_B, SC_B)
    const listValues = (req.scope.resolve as ReturnType<typeof vi.fn>)(METAFIELD_MODULE).listValues as ReturnType<
      typeof vi.fn
    >

    const json = vi.fn()
    const res = { status: vi.fn(() => ({ json })) } as unknown as MedusaResponse

    await GET(req, res)

    expect(listValues).toHaveBeenCalledWith(STORE_B, {
      ownerType: "product",
      ownerId: OWNER_ID,
    })
    expect(json).toHaveBeenCalledWith({
      metafields: [],
      count: 0,
    })
  })
})
