import { describe, expect, it, vi } from "vitest"

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import type { StripeConnectorAdminDto } from "../src/modules/connector/types"
import { GET as stripeGet, PATCH as stripePatch } from "../src/api/admin/connectors/stripe/route"
import { POST as stripeTestPost } from "../src/api/admin/connectors/stripe/test/route"
import { POST as stripeSyncPost } from "../src/api/admin/connectors/stripe/sync-products/route"
import { GET as stripePaymentsGet } from "../src/api/admin/connectors/stripe/payments/route"
import { GET as storefrontVatGet } from "../src/api/store/connectors/stripe/vat/route"

const sampleDto = (): StripeConnectorAdminDto => ({
  configured: true,
  active: true,
  vat_mode: "inclusive",
  secret_key_masked: "…4242",
  publishable_key_masked: "…abcd",
  webhook_secret_masked: "…wsec",
  last_tested_at: "2026-05-01T10:00:00.000Z",
})

function mockReq(svc: Record<string, unknown>): MedusaRequest {
  return {
    scope: {
      resolve: vi.fn().mockReturnValue(svc),
    },
  } as unknown as MedusaRequest
}

function mockRes(): { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  return { status, json }
}

describe("Stripe connector HTTP routes", (): void => {
  it("GET /admin/connectors/stripe returns detail DTO", async (): Promise<void> => {
    const dto = sampleDto()
    const getStripeAdminDetail = vi.fn(async (): Promise<StripeConnectorAdminDto> => dto)

    const req = mockReq({ getStripeAdminDetail })
    const { status, json } = mockRes()

    await stripeGet(req, { status, json } as unknown as MedusaResponse)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: dto })
    expect(getStripeAdminDetail).toHaveBeenCalledTimes(1)
  })

  it("PATCH /admin/connectors/stripe validates body and forwards to service", async (): Promise<void> => {
    const dto = sampleDto()
    const patchStripeConnector = vi.fn(async (): Promise<StripeConnectorAdminDto> => dto)

    const req = {
      ...mockReq({ patchStripeConnector }),
      body: { vat_mode: "exclusive" },
    } as unknown as MedusaRequest

    const { status, json } = mockRes()

    await stripePatch(req, { status, json } as unknown as MedusaResponse)

    expect(patchStripeConnector).toHaveBeenCalledWith({ vat_mode: "exclusive" })
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: dto })
  })

  it("PATCH /admin/connectors/stripe rejects invalid payloads with 400", async (): Promise<void> => {
    const patchStripeConnector = vi.fn()

    const req = {
      ...mockReq({ patchStripeConnector }),
      body: { vat_mode: "invalid" },
    } as unknown as MedusaRequest

    const { status, json } = mockRes()

    await expect(stripePatch(req, { status, json } as unknown as MedusaResponse)).rejects.toMatchObject({
      type: "invalid_data",
    })

    expect(patchStripeConnector).not.toHaveBeenCalled()
  })

  it("POST /admin/connectors/stripe/test returns ok", async (): Promise<void> => {
    const stripeConnectionTestAdmin = vi.fn(async (): Promise<{ ok: true }> => ({ ok: true }))

    const req = mockReq({ stripeConnectionTestAdmin })
    const { status, json } = mockRes()

    await stripeTestPost(req, { status, json } as unknown as MedusaResponse)

    expect(stripeConnectionTestAdmin).toHaveBeenCalledTimes(1)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: { ok: true } })
  })

  it("POST /admin/connectors/stripe/sync-products returns sync result", async (): Promise<void> => {
    const payload = { success: true, result: { stripeProductsCreated: 0 } }
    const stripeSyncAllProductsAdmin = vi.fn(async (): Promise<typeof payload> => payload)

    const req = mockReq({ stripeSyncAllProductsAdmin })
    const { status, json } = mockRes()

    await stripeSyncPost(req, { status, json } as unknown as MedusaResponse)

    expect(stripeSyncAllProductsAdmin).toHaveBeenCalledTimes(1)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: payload })
  })

  it("GET /admin/connectors/stripe/payments maps rows for response", async (): Promise<void> => {
    const rows = [
      {
        id: "pi_123",
        amount_minor: 1000,
        currency: "eur",
        status: "succeeded",
        customerLabel: "a@b.c",
        created_epoch: 1_700_000_000,
      },
    ]

    const stripeListPaymentsAdmin = vi.fn(async (): Promise<typeof rows> => rows)

    const req = {
      ...mockReq({ stripeListPaymentsAdmin }),
      query: {},
    } as unknown as MedusaRequest

    const { status, json } = mockRes()

    await stripePaymentsGet(req, { status, json } as unknown as MedusaResponse)

    expect(stripeListPaymentsAdmin).toHaveBeenCalledWith(50)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      data: {
        payments: [
          {
            id: "pi_123",
            amountMinor: 1000,
            currency: "eur",
            status: "succeeded",
            customerLabel: "a@b.c",
            createdEpoch: 1_700_000_000,
          },
        ],
        count: 1,
        limit: 50,
        offset: 0,
      },
    })
  })

  it("GET /store/connectors/stripe/vat exposes vat_mode", async (): Promise<void> => {
    const getStripeVatModeForStorefront = vi.fn(async (): Promise<"inclusive" | "exclusive"> => "exclusive")

    const req = mockReq({ getStripeVatModeForStorefront })
    const { status, json } = mockRes()

    await storefrontVatGet(req, { status, json } as unknown as MedusaResponse)

    expect(getStripeVatModeForStorefront).toHaveBeenCalledTimes(1)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: { vat_mode: "exclusive" } })
  })
})
