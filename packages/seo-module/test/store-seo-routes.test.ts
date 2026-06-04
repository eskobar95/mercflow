import { afterEach, describe, expect, it, vi } from "vitest"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import { GET as getGlobalJsonLd } from "../src/api/store/seo/json-ld/global/route"

const STORE_A = "store_01KG0VBTT0714XV2CCTEBRVC47"
const STORE_B = "store_01ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const SC_A = "sc_01KG0VBTT0714XV2CCTEBRVC47"

describe("store SEO routes (tenant isolation)", (): void => {
  const originalEnv = process.env.NODE_ENV

  afterEach((): void => {
    process.env.NODE_ENV = originalEnv
  })

  it("GET /store/seo/json-ld/global uses bound tenant config", async (): Promise<void> => {
    process.env.NODE_ENV = "test"
    const getOrCreateSeoConfig = vi.fn(async () => ({
      storefront_url: "https://shop-a.example",
      org_name: "Acme",
      org_logo_url: null,
      org_social_urls: { facebook: "https://facebook.com/acme" },
      json_ld_settings: { global: true },
    }))

    const graph = vi.fn(async () => ({
      data: [{ store: { id: STORE_A } }],
    }))

    const req = {
      headers: { host: "ignored.example" },
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
          if (key === "mercflow_seo") {
            return {
              getSeoConfig: vi.fn(async (): Promise<null> => null),
              getOrCreateSeoConfig,
            }
          }
          throw new Error(`unexpected resolve: ${key}`)
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await expect(getGlobalJsonLd(req, res)).rejects.toMatchObject({
      type: MedusaError.Types.NOT_ALLOWED,
    })
    expect(getOrCreateSeoConfig).not.toHaveBeenCalled()
  })

  it("GET /store/seo/json-ld/global returns json_ld for bound tenant", async (): Promise<void> => {
    process.env.NODE_ENV = "test"
    const getOrCreateSeoConfig = vi.fn(async () => ({
      storefront_url: "https://shop-a.example",
      org_name: "Acme",
      org_logo_url: "https://shop-a.example/logo.png",
      org_social_urls: { facebook: "https://facebook.com/acme" },
      json_ld_settings: { global: true, product: true, category: true },
    }))

    const graph = vi.fn(async () => ({
      data: [{ store: { id: STORE_A } }],
    }))

    const req = {
      headers: {},
      query: {},
      publishable_key_context: {
        key: "pk_test",
        sales_channel_ids: [SC_A],
      },
      scope: {
        resolve: vi.fn((key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) {
            return { graph }
          }
          if (key === "mercflow_seo") {
            return {
              getSeoConfig: vi.fn(async (): Promise<null> => null),
              getOrCreateSeoConfig,
            }
          }
          throw new Error(`unexpected resolve: ${key}`)
        }),
      },
    } as unknown as MedusaRequest

    const json = vi.fn()
    const status = vi.fn().mockReturnValue({ json })
    const res = { status, json } as unknown as MedusaResponse

    await getGlobalJsonLd(req, res)

    expect(getOrCreateSeoConfig).toHaveBeenCalledWith(STORE_A)
    expect(status).toHaveBeenCalledWith(200)
    expect(json.mock.calls[0]?.[0]).toMatchObject({
      json_ld: expect.objectContaining({
        "@context": "https://schema.org",
      }),
    })
  })
})
