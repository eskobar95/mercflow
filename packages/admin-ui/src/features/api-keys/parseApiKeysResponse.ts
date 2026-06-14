import type { ApiKeyDto, ApiKeyListDto, ApiKeySalesChannelDto, ApiKeyTypeDto } from "./types"

function isApiKeyType(value: string): value is ApiKeyTypeDto {
  return value === "publishable" || value === "secret"
}

function parseSalesChannel(value: unknown): ApiKeySalesChannelDto | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }
  const rec = value as Record<string, unknown>
  const id = rec["id"]
  const name = rec["name"]
  if (typeof id !== "string" || typeof name !== "string") {
    return null
  }
  return { id, name }
}

function parseApiKey(value: unknown): ApiKeyDto | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }
  const rec = value as Record<string, unknown>
  const id = rec["id"]
  const title = rec["title"]
  const typeRaw = rec["type"]
  const token = rec["token"]
  const redacted = rec["redacted"]
  const revokedAt = rec["revoked_at"]
  const createdAt = rec["created_at"]
  const salesChannelsRaw = rec["sales_channels"]

  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    typeof typeRaw !== "string" ||
    !isApiKeyType(typeRaw) ||
    typeof token !== "string" ||
    typeof redacted !== "string" ||
    typeof createdAt !== "string"
  ) {
    return null
  }

  if (revokedAt !== null && typeof revokedAt !== "string") {
    return null
  }

  const sales_channels: ApiKeySalesChannelDto[] = []
  if (Array.isArray(salesChannelsRaw)) {
    for (const item of salesChannelsRaw) {
      const parsed = parseSalesChannel(item)
      if (parsed !== null) {
        sales_channels.push(parsed)
      }
    }
  }

  return {
    id,
    title,
    type: typeRaw,
    token,
    redacted,
    revoked_at: revokedAt,
    created_at: createdAt,
    sales_channels,
  }
}

export function parseApiKeysListResponse(value: unknown): ApiKeyListDto | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }
  const rec = value as Record<string, unknown>
  const apiKeysRaw = rec["api_keys"]
  const countRaw = rec["count"]
  if (!Array.isArray(apiKeysRaw) || typeof countRaw !== "number") {
    return null
  }

  const api_keys: ApiKeyDto[] = []
  for (const item of apiKeysRaw) {
    const parsed = parseApiKey(item)
    if (parsed !== null) {
      api_keys.push(parsed)
    }
  }

  return { api_keys, count: countRaw }
}

export function parseApiKeyResponse(value: unknown): ApiKeyDto | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }
  const rec = value as Record<string, unknown>
  return parseApiKey(rec["api_key"])
}

export function isFullPublishableToken(token: string): boolean {
  return /^pk_[a-zA-Z0-9_]+$/.test(token) && !token.includes("***")
}
