import { afterEach, describe, expect, it } from "vitest"

import {
  clearFeedCacheForTests,
  getCachedFeedXml,
  getFeedCacheUpdatedAt,
  invalidateFeedCache,
  setCachedFeedXml,
} from "../src/modules/feed/feed-cache"

const STORE = "store_01KG0VBTT0714XV2CCTEBRVC47"

describe("feed cache", (): void => {
  afterEach((): void => {
    clearFeedCacheForTests()
  })

  it("returns cached xml until invalidated", (): void => {
    setCachedFeedXml(STORE, "<rss></rss>", 60_000, 1_000)
    expect(getCachedFeedXml(STORE, 1_500)).toBe("<rss></rss>")
    invalidateFeedCache(STORE)
    expect(getCachedFeedXml(STORE, 1_600)).toBeNull()
  })

  it("exposes cache updated timestamp while entry is valid", (): void => {
    setCachedFeedXml(STORE, "<rss></rss>", 60_000, 1_000)
    expect(getFeedCacheUpdatedAt(STORE, 1_500)).toBe(new Date(1_000).toISOString())
    invalidateFeedCache(STORE)
    expect(getFeedCacheUpdatedAt(STORE, 1_600)).toBeNull()
  })
})
