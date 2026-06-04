import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import type { ShipmondoAdminGetDto } from "../src/modules/connector/types"

import { GET as GETShipmondo, PATCH as PATCHShipmondo } from "../src/api/admin/connectors/shipmondo/route"
import { POST as POSTShipmondoTest } from "../src/api/admin/connectors/shipmondo/test/route"
import { GET as GETShipmondoStore } from "../src/api/store/connectors/shipmondo/active/route"

const samplePayload: ShipmondoAdminGetDto = {
  type: "shipmondo",
  active: false,
  lastTestedAt: null,
  credentials: {
    apiUserConfigured: true,
    apiKeyConfigured: true,
    shippingModuleKeyConfigured: false,
  },
  recentLogs: [
    {
      id: "log_1",
      createdAt: "2026-05-01T10:15:30.000Z",
      message: "Shipmondo responded with HTTP 200",
      success: true,
    },
  ],
}

describe("Shipmondo connector admin routes", (): void => {
  it("GET /admin/connectors/shipmondo proxies to module service summary", async (): Promise<void> => {
    const getShipmondoAdminPayload = vi.fn(async (): Promise<ShipmondoAdminGetDto> => samplePayload)

    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({
          getShipmondoAdminPayload,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await GETShipmondo(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: samplePayload })
    expect(getShipmondoAdminPayload).toHaveBeenCalledTimes(1)
  })

  it("PATCH /admin/connectors/shipmondo validates body with Zod and delegates to service", async (): Promise<void> => {
    const patchShipmondo = vi.fn(async (): Promise<ShipmondoAdminGetDto> => samplePayload)

    const req = {
      body: {
        api_user: "hello",
        api_key: "world",
      },
      scope: {
        resolve: vi.fn().mockReturnValue({
          patchShipmondo,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { json, status } as unknown as MedusaResponse

    await PATCHShipmondo(req, res)

    expect(patchShipmondo).toHaveBeenCalledWith(req.body)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: samplePayload })
  })

  it("POST /admin/connectors/shipmondo/test returns upstream contract", async (): Promise<void> => {
    const testShipmondoConnection = vi.fn(
      async (): Promise<{ success: boolean; message: string }> => ({
        success: true,
        message: "ok",
      })
    )

    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({
          testShipmondoConnection,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await POSTShipmondoTest(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: "ok",
    })
    expect(testShipmondoConnection).toHaveBeenCalledTimes(1)
  })
})

describe("Shipmondo store activation route", (): void => {
  it("surfaces storefront activation gate", async (): Promise<void> => {
    const getShipmondoStoreActivation = vi.fn(
      async (): Promise<{ active: boolean }> => ({ active: true })
    )

    const req = {
      scope: {
        resolve: vi.fn().mockReturnValue({
          getShipmondoStoreActivation,
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { json, status } as unknown as MedusaResponse

    await GETShipmondoStore(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: { active: true } })
    expect(getShipmondoStoreActivation).toHaveBeenCalledTimes(1)
  })
})
