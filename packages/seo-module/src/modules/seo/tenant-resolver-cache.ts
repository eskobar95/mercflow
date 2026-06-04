const DEFAULT_TTL_MS = 60_000

type CacheEntry = {
  storeId: string | null
  expiresAtMs: number
}

const cacheByHost = new Map<string, CacheEntry>()

export function getCachedStoreIdForHost(
  host: string,
  nowMs: number = Date.now()
): string | null | undefined {
  const entry = cacheByHost.get(host)
  if (!entry) {
    return undefined
  }
  if (nowMs >= entry.expiresAtMs) {
    cacheByHost.delete(host)
    return undefined
  }
  return entry.storeId
}

export function setCachedStoreIdForHost(
  host: string,
  storeId: string | null,
  ttlMs: number = DEFAULT_TTL_MS,
  nowMs: number = Date.now()
): void {
  cacheByHost.set(host, {
    storeId,
    expiresAtMs: nowMs + ttlMs,
  })
}

export function clearAllTenantResolverCaches(): void {
  cacheByHost.clear()
}

export function clearTenantResolverCacheForTests(): void {
  clearAllTenantResolverCaches()
}
