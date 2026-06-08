import type { MedusaRequest } from "@medusajs/framework/http"
import { afterEach, describe, expect, it, vi } from "vitest"

import { resolveSentryStoreId } from "../src/lib/resolve-sentry-store-id"
import { initSentry, isSentryEnabled } from "../src/lib/sentry"

function createRequest(overrides: Partial<MedusaRequest> = {}): MedusaRequest {
  return {
    query: {},
    headers: {},
    scope: { resolve: vi.fn() },
    ...overrides,
  } as MedusaRequest
}

describe("initSentry", (): void => {
  afterEach((): void => { vi.unstubAllEnvs() })
  it("does not enable Sentry without SENTRY_DSN", (): void => {
    vi.stubEnv("SENTRY_DSN", "")
    initSentry()
    expect(isSentryEnabled()).toBe(false)
  })
})

describe("resolveSentryStoreId", (): void => {
  afterEach((): void => { vi.unstubAllEnvs() })
  it("prefers mercflowStoreId from public tenant middleware", async (): Promise<void> => {
    const req = createRequest({ headers: { "x-store-id": "store_from_header" } })
    ;(req as MedusaRequest & { mercflowStoreId?: string }).mercflowStoreId = "store_from_host"
    await expect(resolveSentryStoreId(req)).resolves.toBe("store_from_host")
  })
  it("reads store_id from query", async (): Promise<void> => {
    const req = createRequest({ query: { store_id: "store_query" } })
    await expect(resolveSentryStoreId(req)).resolves.toBe("store_query")
  })
  it("falls back to MERCFLOW_DEFAULT_STORE_ID", async (): Promise<void> => {
    vi.stubEnv("MERCFLOW_DEFAULT_STORE_ID", "store_default")
    await expect(resolveSentryStoreId(createRequest())).resolves.toBe("store_default")
  })
})
