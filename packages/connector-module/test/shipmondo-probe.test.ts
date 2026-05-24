import { describe, expect, it, vi } from "vitest"

import { probeShipmondoShipments } from "../src/modules/connector/shipmondo-http-client"

describe("Shipmondo HTTP probe helper", (): void => {
  it("treats HTTP 200 as ok", async (): Promise<void> => {
    const fetchImpl = vi.fn(async (): Promise<Response> => {
      return new Response("[]", { status: 200 })
    })

    const result = await probeShipmondoShipments({
      apiUser: "user",
      apiKey: "key",
      fetchImpl,
    })

    expect(result.ok).toBe(true)
    expect(result.httpStatus).toBe(200)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("treats HTTP 401 as failure", async (): Promise<void> => {
    const fetchImpl = vi.fn(async (): Promise<Response> => {
      return new Response("Unauthorized", { status: 401 })
    })

    const result = await probeShipmondoShipments({
      apiUser: "user",
      apiKey: "key",
      fetchImpl,
    })

    expect(result.ok).toBe(false)
    expect(result.httpStatus).toBe(401)
  })

  it("returns httpStatus 0 when fetch throws", async (): Promise<void> => {
    const fetchImpl = vi.fn(async (): Promise<Response> => {
      throw new Error("network down")
    })

    const result = await probeShipmondoShipments({
      apiUser: "user",
      apiKey: "key",
      fetchImpl,
    })

    expect(result.ok).toBe(false)
    expect(result.httpStatus).toBe(0)
  })
})
