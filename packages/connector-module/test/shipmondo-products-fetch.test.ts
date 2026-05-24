import { describe, expect, it, vi } from "vitest"

import { fetchShipmondoProductsJson } from "../src/modules/connector/shipmondo-http-client"

describe("fetchShipmondoProductsJson", (): void => {
  it("performs authenticated GET requests against the Shipmondo products endpoint", async (): Promise<void> => {
    const fetchMock = vi.fn(
      async (): Promise<Response> =>
        new Response(JSON.stringify({ carrier_products: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
    )

    await fetchShipmondoProductsJson({
      apiUser: "user",
      apiKey: "key",
      countryCode: "dk",
      fetchImpl: fetchMock,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const call = fetchMock.mock.calls[0] as [string, RequestInit] | undefined
    expect(call).toBeTruthy()
    const [calledUrl, init] = call!

    expect(calledUrl).toContain("/api/public/v3/products")
    expect(calledUrl).toContain("country_code=DK")

    expect(init.method).toEqual("GET")
    expect(init.headers).toBeTruthy()
  })
})
