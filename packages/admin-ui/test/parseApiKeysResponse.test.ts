import { describe, expect, it } from "vitest"

import {
  isFullPublishableToken,
  parseApiKeyResponse,
  parseApiKeysListResponse,
} from "@/features/api-keys/parseApiKeysResponse"
import {
  TEST_PUBLISHABLE_REDACTED,
  TEST_PUBLISHABLE_REDACTED_NEW,
  TEST_PUBLISHABLE_TOKEN,
  TEST_PUBLISHABLE_TOKEN_NEW,
} from "./fixtures/apiKeyFixtures"

describe("parseApiKeysListResponse", (): void => {
  it("parses publishable API keys list", (): void => {
    const parsed = parseApiKeysListResponse({
      api_keys: [
        {
          id: "apk_1",
          title: "Storefront",
          type: "publishable",
          token: TEST_PUBLISHABLE_TOKEN,
          redacted: TEST_PUBLISHABLE_REDACTED,
          revoked_at: null,
          created_at: "2026-01-01T00:00:00.000Z",
          sales_channels: [{ id: "sc_1", name: "Default" }],
        },
      ],
      count: 1,
    })

    expect(parsed?.api_keys).toHaveLength(1)
    expect(parsed?.api_keys[0]?.type).toBe("publishable")
  })

  it("returns null for invalid payloads", (): void => {
    expect(parseApiKeysListResponse(null)).toBeNull()
  })
})

describe("parseApiKeyResponse", (): void => {
  it("parses single API key response", (): void => {
    const parsed = parseApiKeyResponse({
      api_key: {
        id: "apk_1",
        title: "Storefront",
        type: "publishable",
        token: TEST_PUBLISHABLE_TOKEN_NEW,
        redacted: TEST_PUBLISHABLE_REDACTED_NEW,
        revoked_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    })

    expect(parsed?.token).toBe(TEST_PUBLISHABLE_TOKEN_NEW)
  })
})

describe("isFullPublishableToken", (): void => {
  it("detects unredacted publishable tokens", (): void => {
    expect(isFullPublishableToken(TEST_PUBLISHABLE_TOKEN)).toBe(true)
    expect(isFullPublishableToken(TEST_PUBLISHABLE_REDACTED)).toBe(false)
  })
})
