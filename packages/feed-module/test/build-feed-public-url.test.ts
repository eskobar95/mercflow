import { afterEach, describe, expect, it } from "vitest"

import { buildFeedPublicUrl } from "../src/modules/feed/build-feed-public-url"

describe("buildFeedPublicUrl", (): void => {
  const prev = process.env.MERCFLOW_FEED_PUBLIC_BASE_URL

  afterEach((): void => {
    if (prev === undefined) {
      delete process.env.MERCFLOW_FEED_PUBLIC_BASE_URL
    } else {
      process.env.MERCFLOW_FEED_PUBLIC_BASE_URL = prev
    }
  })

  it("returns null when storefront url is missing", (): void => {
    expect(buildFeedPublicUrl(null)).toBeNull()
    expect(buildFeedPublicUrl("   ")).toBeNull()
  })

  it("appends feed path and trims trailing slash", (): void => {
    expect(buildFeedPublicUrl("https://shop.example.com/")).toBe(
      "https://shop.example.com/feed/google-shopping.xml"
    )
  })

  it("uses MERCFLOW_FEED_PUBLIC_BASE_URL when set", (): void => {
    process.env.MERCFLOW_FEED_PUBLIC_BASE_URL = "https://cdn.example.com/"
    expect(buildFeedPublicUrl("https://shop.example.com")).toBe(
      "https://cdn.example.com/feed/google-shopping.xml"
    )
  })
})
