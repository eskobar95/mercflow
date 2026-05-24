import { beforeEach, describe, expect, it, vi } from "vitest"

import { CONNECTOR_MODULE } from "../src/modules/connector"
import type ConnectorModuleService from "../src/modules/connector/service"
import { resolveShipmondoCredentialsWithFallback } from "../src/integrations/resolve-shipmondo-credentials"

describe("resolveShipmondoCredentialsWithFallback", () => {
  beforeEach(() => {
    delete process.env.SHIPMONDO_API_USER
    delete process.env.SHIPMONDO_API_KEY
  })

  function containerFor(service: ConnectorModuleService): { resolve: <T>(key: string) => T } {
    return {
      resolve: <T,>(key: string): T => {
        if (key === CONNECTOR_MODULE) {
          return service as T
        }
        throw new Error(`unexpected resolve key ${key}`)
      },
    }
  }

  it("prefers decrypted connector credentials over env", async (): Promise<void> => {
    const service = {
      resolveShipmondoCredentialsOrNull: vi.fn(async () =>
        Promise.resolve({
          api_user: "db-user",
          api_key: "db-key",
        })
      ),
    } as unknown as ConnectorModuleService

    process.env.SHIPMONDO_API_USER = "env-user"
    process.env.SHIPMONDO_API_KEY = "env-key"

    const resolved = await resolveShipmondoCredentialsWithFallback(containerFor(service))

    expect(resolved).toEqual({ api_user: "db-user", api_key: "db-key" })
    expect(service.resolveShipmondoCredentialsOrNull).toHaveBeenCalledOnce()
  })

  it("falls back to env when connector returns null", async (): Promise<void> => {
    const service = {
      resolveShipmondoCredentialsOrNull: vi.fn(async () => Promise.resolve(null)),
    } as unknown as ConnectorModuleService

    process.env.SHIPMONDO_API_USER = "fallback-user "
    process.env.SHIPMONDO_API_KEY = "fallback-key"

    const resolved = await resolveShipmondoCredentialsWithFallback(containerFor(service))

    expect(resolved).toEqual({ api_user: "fallback-user", api_key: "fallback-key" })
  })

  it("returns null when neither connector nor env provides both values", async (): Promise<void> => {
    const service = {
      resolveShipmondoCredentialsOrNull: vi.fn(async () => Promise.resolve(null)),
    } as unknown as ConnectorModuleService

    process.env.SHIPMONDO_API_USER = "only-user"

    const resolved = await resolveShipmondoCredentialsWithFallback(containerFor(service))

    expect(resolved).toBeNull()
  })
})
