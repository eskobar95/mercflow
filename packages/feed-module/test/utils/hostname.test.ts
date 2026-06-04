import { describe, expect, it } from "vitest"

import {
  hostnameFromStorefrontUrl,
  hostsMatchStorefront,
  normalizeHostname,
} from "../../src/modules/feed/utils/hostname"

describe("hostname utils", (): void => {
  it("normalizes Host header values", (): void => {
    expect(normalizeHostname("Shop.Example:443")).toBe("shop.example")
    expect(normalizeHostname("https://Shop.Example/path")).toBe("shop.example")
  })

  it("matches storefront_url host to request Host", (): void => {
    expect(hostsMatchStorefront("https://shop.example", "shop.example")).toBe(true)
    expect(hostsMatchStorefront("https://other.example", "shop.example")).toBe(false)
  })

  it("extracts hostname from storefront URL", (): void => {
    expect(hostnameFromStorefrontUrl("https://shop.example/catalog")).toBe("shop.example")
  })
})
