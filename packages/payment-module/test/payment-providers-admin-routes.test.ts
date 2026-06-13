import { describe, expect, it, vi } from "vitest"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import { PAYMENT_MODULE } from "../src/modules/payment/types"
import { GET, PUT } from "../src/api/admin/payment-providers/route"
import { POST as postMode } from "../src/api/admin/payment-providers/mode/route"

const STORE_ID = "store_01KG0VBTT0714XV2CCTEBRVC47"

function mockReq(
  service: Record<string, unknown>,
  overrides: Partial<MedusaRequest> = {}
): MedusaRequest {
  return {
    query: {},
    body: {},
    scope: {
      resolve: vi.fn((key: string) => {
        if (key === PAYMENT_MODULE) {
          return service
        }
        throw new Error(`Unexpected resolve: ${key}`)
      }),
    },
    ...overrides,
  } as unknown as MedusaRequest
}

describe("payment-providers admin HTTP routes", (): void => {
  it("GET /admin/payment-providers returns admin DTO without secret keys", async (): Promise<void> => {
    const getAdminProviderSnapshot = vi.fn(async () => ({
      id: "ppc_1",
      store_id: STORE_ID,
      provider: "stripe" as const,
      mode: "test" as const,
      publishable_key: "pk_test_abc",
      test_publishable_key: "pk_test_abc",
      live_publishable_key: null,
      test_has_secret_key: true,
      live_has_secret_key: false,
      test_has_webhook_secret: true,
      live_has_webhook_secret: false,
      configured: true,
      created_at: "2026-06-13T00:00:00.000Z",
      updated_at: "2026-06-13T00:00:00.000Z",
      deleted_at: null,
    }))

    process.env.MERCFLOW_DEFAULT_STORE_ID = STORE_ID
    const req = mockReq({ getAdminProviderSnapshot })
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status, json } as unknown as MedusaResponse

    await GET(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      payment_provider: expect.objectContaining({
        store_id: STORE_ID,
        mode: "test",
        publishable_key: "pk_test_abc",
        test_has_secret_key: true,
        configured: true,
      }),
    })
    expect(json.mock.calls[0]?.[0]?.payment_provider).not.toHaveProperty("test_secret_key")
    expect(getAdminProviderSnapshot).toHaveBeenCalledWith(STORE_ID)
  })

  it("PUT /admin/payment-providers validates body and upserts credentials", async (): Promise<void> => {
    const upsertProviderConfig = vi.fn(async () => ({
      id: "ppc_1",
      store_id: STORE_ID,
      provider: "stripe",
      mode: "test",
      publishable_key: "pk_test_new",
      test_publishable_key: "pk_test_new",
      live_publishable_key: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }))
    const getAdminProviderSnapshot = vi.fn(async () => ({
      id: "ppc_1",
      store_id: STORE_ID,
      provider: "stripe" as const,
      mode: "test" as const,
      publishable_key: "pk_test_new",
      test_publishable_key: "pk_test_new",
      live_publishable_key: null,
      test_has_secret_key: true,
      live_has_secret_key: false,
      test_has_webhook_secret: false,
      live_has_webhook_secret: false,
      configured: true,
      created_at: "2026-06-13T00:00:00.000Z",
      updated_at: "2026-06-13T00:00:00.000Z",
      deleted_at: null,
    }))

    process.env.MERCFLOW_DEFAULT_STORE_ID = STORE_ID
    const req = mockReq(
      { upsertProviderConfig, getAdminProviderSnapshot },
      {
        body: {
          test_secret_key: "sk_test_secret",
          test_publishable_key: "pk_test_new",
        },
      }
    )
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status, json } as unknown as MedusaResponse

    await PUT(req, res)

    expect(upsertProviderConfig).toHaveBeenCalledWith(STORE_ID, {
      provider: "stripe",
      test_secret_key: "sk_test_secret",
      test_publishable_key: "pk_test_new",
    })
    expect(status).toHaveBeenCalledWith(200)
  })

  it("PUT rejects unknown fields with 400", async (): Promise<void> => {
    process.env.MERCFLOW_DEFAULT_STORE_ID = STORE_ID
    const upsertProviderConfig = vi.fn()
    const req = mockReq({ upsertProviderConfig }, { body: { unknown_field: true } })
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status, json } as unknown as MedusaResponse

    await expect(PUT(req, res)).rejects.toMatchObject({
      type: MedusaError.Types.INVALID_DATA,
    })
    expect(upsertProviderConfig).not.toHaveBeenCalled()
  })

  it("POST /admin/payment-providers/mode switches mode", async (): Promise<void> => {
    const setMode = vi.fn(async () => ({
      id: "ppc_1",
      store_id: STORE_ID,
      provider: "stripe",
      mode: "live",
      publishable_key: "pk_live_xyz",
      test_publishable_key: "pk_test_abc",
      live_publishable_key: "pk_live_xyz",
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }))
    const getAdminProviderSnapshot = vi.fn(async () => ({
      id: "ppc_1",
      store_id: STORE_ID,
      provider: "stripe" as const,
      mode: "live" as const,
      publishable_key: "pk_live_xyz",
      test_publishable_key: "pk_test_abc",
      live_publishable_key: "pk_live_xyz",
      test_has_secret_key: true,
      live_has_secret_key: true,
      test_has_webhook_secret: false,
      live_has_webhook_secret: true,
      configured: true,
      created_at: "2026-06-13T00:00:00.000Z",
      updated_at: "2026-06-13T00:00:00.000Z",
      deleted_at: null,
    }))

    process.env.MERCFLOW_DEFAULT_STORE_ID = STORE_ID
    const req = mockReq(
      { setMode, getAdminProviderSnapshot },
      { body: { mode: "live" } }
    )
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status, json } as unknown as MedusaResponse

    await postMode(req, res)

    expect(setMode).toHaveBeenCalledWith(STORE_ID, "live", "stripe")
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      payment_provider: expect.objectContaining({ mode: "live" }),
    })
  })
})
