import { MedusaError } from "@medusajs/utils"

import type FeedConfigService from "./service"
import { assertMedusaStoreId } from "./tenant-scope"
import { hostsMatchStorefront, normalizeHostname } from "./utils/hostname"

function parseHostMapEnv(): Record<string, string> {
  const raw = process.env.MERCFLOW_FEED_HOST_MAP?.trim()
  if (!raw) {
    return {}
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {}
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
        // skip invalid store ids in env map
      }
    }
    return out
  } catch {
    return {}
  }
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

export type ResolveStoreIdFromHostInput = {
  hostHeader: string | undefined
  storeIdHeader: string | undefined
  feedConfigService: FeedConfigService
}

/**
 * Resolves tenant `store_id` from Host → `mercflow_feed_config.storefront_url` (T008-style, feed-only).
 * Fail closed: returns null when no mapping matches.
 */
export async function resolveStoreIdFromHost(
  input: ResolveStoreIdFromHostInput
): Promise<string | null> {
  const storeIdHeader = input.storeIdHeader?.trim()
  if (storeIdHeader) {
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

  const hostMap = parseHostMapEnv()
  const mapped = hostMap[normalizedHost]
  if (mapped) {
    return mapped
  }

  const candidates = parseStoreIdCandidates()
  for (const storeId of candidates) {
    const config = await input.feedConfigService.get(storeId)
    if (!config?.storefront_url) {
      continue
    }
    if (hostsMatchStorefront(config.storefront_url, normalizedHost)) {
      return storeId
    }
  }

  return null
}

export function assertResolvedStoreId(storeId: string | null): string {
  if (!storeId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "No tenant found for this host")
  }
  return storeId
}
