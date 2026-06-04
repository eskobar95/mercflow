import { MedusaError } from "@medusajs/utils"

import { assertMedusaStoreId } from "./tenant-scope"
import {
  getCachedStoreIdForHost,
  setCachedStoreIdForHost,
} from "./tenant-resolver-cache"
import { hostsMatchStorefront, normalizeHostname } from "./utils/hostname"

export type StorefrontUrlLookup = {
  getStorefrontUrl: (storeId: string) => Promise<string | null>
}

function parseHostMapEnv(): Record<string, string> {
  const keys = ["MERCFLOW_HOST_MAP", "MERCFLOW_SEO_HOST_MAP", "MERCFLOW_FEED_HOST_MAP"] as const
  for (const key of keys) {
    const raw = process.env[key]?.trim()
    if (!raw) {
      continue
    }
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        continue
      }
      const out: Record<string, string> = {}
      for (const [host, storeId] of Object.entries(parsed)) {
        const normalizedHost = normalizeHostname(host)
        if (!normalizedHost || typeof storeId !== "string") {
          continue
        }
        try {
          assertMedusaStoreId(storeId)
          out[normalizedHost] = storeId
        } catch {
          // skip invalid store ids
        }
      }
      return out
    } catch {
      continue
    }
  }
  return {}
}

function parseStoreIdCandidates(): string[] {
  const raw = process.env.MERCFLOW_TENANT_STORE_IDS?.trim()
  if (!raw) {
    return []
  }
  const ids: string[] = []
  for (const part of raw.split(",")) {
    const trimmed = part.trim()
    if (trimmed.length === 0) {
      continue
    }
    try {
      assertMedusaStoreId(trimmed)
      ids.push(trimmed)
    } catch {
      // skip invalid entries
    }
  }
  return ids
}

function isXStoreIdHeaderAllowed(): boolean {
  if (process.env.MERCFLOW_ALLOW_X_STORE_ID === "true") {
    return true
  }
  const env = process.env.NODE_ENV?.trim().toLowerCase()
  return env === "development" || env === "test"
}

export type ResolveStoreIdFromHostInput = {
  hostHeader: string | undefined
  storeIdHeader: string | undefined
  lookup: StorefrontUrlLookup
}

/**
 * Resolves tenant `store_id` from Host → `mercflow_seo_config.storefront_url` (T008 / option A).
 * Fail closed: returns null when no mapping matches.
 */
export async function resolveStoreIdFromHost(
  input: ResolveStoreIdFromHostInput
): Promise<string | null> {
  const storeIdHeader = input.storeIdHeader?.trim()
  if (storeIdHeader && isXStoreIdHeaderAllowed()) {
    try {
      assertMedusaStoreId(storeIdHeader)
      return storeIdHeader
    } catch {
      return null
    }
  }

  const host = input.hostHeader?.trim()
  if (!host) {
    return null
  }
  const normalizedHost = normalizeHostname(host)
  if (!normalizedHost) {
    return null
  }

  const cached = getCachedStoreIdForHost(normalizedHost)
  if (cached !== undefined) {
    return cached
  }

  const hostMap = parseHostMapEnv()
  const mapped = hostMap[normalizedHost]
  if (mapped) {
    setCachedStoreIdForHost(normalizedHost, mapped)
    return mapped
  }

  const candidates = parseStoreIdCandidates()
  for (const storeId of candidates) {
    const storefrontUrl = await input.lookup.getStorefrontUrl(storeId)
    if (!storefrontUrl) {
      continue
    }
    if (hostsMatchStorefront(storefrontUrl, normalizedHost)) {
      setCachedStoreIdForHost(normalizedHost, storeId)
      return storeId
    }
  }

  // Do not negative-cache misses — storefront_url / host map may be fixed without waiting for TTL.
  return null
}

export function assertResolvedStoreId(storeId: string | null): string {
  if (!storeId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "No tenant found for this host")
  }
  return storeId
}
