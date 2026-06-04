const DEFAULT_TTL_MS = 30_000

type SitemapCacheEntry = {
  xml: string
  expiresAtMs: number
  cachedAtMs: number
}

const cacheByStoreId = new Map<string, SitemapCacheEntry>()

export function getCachedSitemapXml(storeId: string, nowMs: number = Date.now()): string | null {
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

export function setCachedSitemapXml(
  storeId: string,
  xml: string,
  ttlMs: number = DEFAULT_TTL_MS,
  nowMs: number = Date.now()
): void {
  cacheByStoreId.set(storeId, {
    xml,
    expiresAtMs: nowMs + ttlMs,
    cachedAtMs: nowMs,
  })
}

export function getSitemapCacheUpdatedAt(
  storeId: string,
  nowMs: number = Date.now()
): string | null {
  const entry = cacheByStoreId.get(storeId)
  if (!entry) {
    return null
  }
  if (nowMs >= entry.expiresAtMs) {
    cacheByStoreId.delete(storeId)
    return null
  }
  return new Date(entry.cachedAtMs).toISOString()
}

export function invalidateSitemapCache(storeId: string): void {
  cacheByStoreId.delete(storeId)
}

export function invalidateAllSitemapCaches(): void {
  cacheByStoreId.clear()
}

export function clearSitemapCacheForTests(): void {
  cacheByStoreId.clear()
}
