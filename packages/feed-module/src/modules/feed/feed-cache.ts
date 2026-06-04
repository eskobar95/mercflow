const DEFAULT_TTL_MS = 60_000

type FeedCacheEntry = {
  xml: string
  expiresAtMs: number
}

const cacheByStoreId = new Map<string, FeedCacheEntry>()

export function getCachedFeedXml(storeId: string, nowMs: number = Date.now()): string | null {
  const entry = cacheByStoreId.get(storeId)
  if (!entry) {
    return null
  }
  if (nowMs >= entry.expiresAtMs) {
    cacheByStoreId.delete(storeId)
    return null
  }
  return entry.xml
}

export function setCachedFeedXml(
  storeId: string,
  xml: string,
  ttlMs: number = DEFAULT_TTL_MS,
  nowMs: number = Date.now()
): void {
  cacheByStoreId.set(storeId, {
    xml,
    expiresAtMs: nowMs + ttlMs,
  })
}

export function invalidateFeedCache(storeId: string): void {
  cacheByStoreId.delete(storeId)
}

export function invalidateAllFeedCaches(): void {
  cacheByStoreId.clear()
}

export function clearFeedCacheForTests(): void {
  cacheByStoreId.clear()
}
