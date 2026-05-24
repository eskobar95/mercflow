import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { pingPlunkWithSecretKey } from "../src/modules/connector/plunk-remote"

describe("plunk-remote", (): void => {
  const fetchMock = vi.fn()

  beforeEach((): void => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch)
    delete process.env["PLUNK_API_BASE_URL"]
  })

  afterEach((): void => {
    vi.unstubAllGlobals()
  })

  it("returns ok:true when track probe succeeds", async (): Promise<void> => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200, statusText: "OK" })
    )

    const out = await pingPlunkWithSecretKey("sk_test12345")
    expect(out).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.useplunk.com/v1/track",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test12345",
          "Content-Type": "application/json",
        }),
      })
    )
  })

  it("returns ok:false with message when probe fails", async (): Promise<void> => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_API_KEY", message: "Invalid secret API key." },
        }),
        { status: 401, statusText: "Unauthorized" }
      )
    )

    const out = await pingPlunkWithSecretKey("sk_bad")

    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.message).toContain("Invalid")
    }
  })
})
