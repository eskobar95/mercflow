import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resolvePlunkSecretApiKeyWithFallback } from "../src/integrations/resolve-plunk-secret-api-key"

describe("resolvePlunkSecretApiKeyWithFallback", (): void => {
  const originalEnv = process.env.PLUNK_SECRET_KEY

  beforeEach((): void => {
    delete process.env.PLUNK_SECRET_KEY
  })

  afterEach((): void => {
    if (originalEnv === undefined) {
      delete process.env.PLUNK_SECRET_KEY
    } else {
      process.env.PLUNK_SECRET_KEY = originalEnv
    }
    vi.restoreAllMocks()
  })

  it("prefers encrypted connector_config key over env fallback", async (): Promise<void> => {
    const resolvePlunkApiKey = vi.fn().mockResolvedValue("sk_from_db")
    const container = {
      resolve: vi.fn().mockReturnValue({ resolvePlunkApiKey }),
    }
    process.env.PLUNK_SECRET_KEY = "sk_from_env"
    await expect(resolvePlunkSecretApiKeyWithFallback(container)).resolves.toBe("sk_from_db")
  })

  it("falls back to PLUNK_SECRET_KEY when connector returns null", async (): Promise<void> => {
    const resolvePlunkApiKey = vi.fn().mockResolvedValue(null)
    const container = {
      resolve: vi.fn().mockReturnValue({ resolvePlunkApiKey }),
    }
    process.env.PLUNK_SECRET_KEY = "  sk_fallback  "
    await expect(resolvePlunkSecretApiKeyWithFallback(container)).resolves.toBe("sk_fallback")
  })

  it("returns null when neither connector nor env provides a key", async (): Promise<void> => {
    const resolvePlunkApiKey = vi.fn().mockResolvedValue(null)
    const container = {
      resolve: vi.fn().mockReturnValue({ resolvePlunkApiKey }),
    }
    await expect(resolvePlunkSecretApiKeyWithFallback(container)).resolves.toBeNull()
  })
})
