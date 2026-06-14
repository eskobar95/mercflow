import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import { parseApiKeyResponse, parseApiKeysListResponse } from "./parseApiKeysResponse"
import type { ApiKeyDto } from "./types"

function requireBackendBase(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000).",
    )
  }
  return base
}

export async function listPublishableApiKeys(): Promise<ApiKeyDto[]> {
  const base = requireBackendBase()
  const params = new URLSearchParams({ type: "publishable", limit: "50" })
  const response = await fetch(`${base}/admin/api-keys?${params.toString()}`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseApiKeysListResponse(json)
  if (parsed === null) {
    throw new TypeError("Invalid API response: expected publishable API keys list")
  }

  return parsed.api_keys.filter((key) => key.revoked_at === null)
}

export async function revokeApiKey(apiKeyId: string): Promise<ApiKeyDto> {
  const base = requireBackendBase()
  const response = await fetch(`${base}/admin/api-keys/${encodeURIComponent(apiKeyId)}/revoke`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseApiKeyResponse(json)
  if (parsed === null) {
    throw new TypeError("Invalid API response: expected revoked API key")
  }
  return parsed
}

export async function createPublishableApiKey(title: string): Promise<ApiKeyDto> {
  const base = requireBackendBase()
  const response = await fetch(`${base}/admin/api-keys`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({ title, type: "publishable" }),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseApiKeyResponse(json)
  if (parsed === null) {
    throw new TypeError("Invalid API response: expected created API key")
  }
  return parsed
}

export async function linkApiKeyToSalesChannels(
  apiKeyId: string,
  salesChannelIds: string[],
): Promise<ApiKeyDto> {
  const base = requireBackendBase()
  const response = await fetch(
    `${base}/admin/api-keys/${encodeURIComponent(apiKeyId)}/sales-channels`,
    {
      method: "POST",
      headers: buildMedusaAdminJsonHeaders(),
      credentials: "include",
      body: JSON.stringify({ add: salesChannelIds }),
    },
  )

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseApiKeyResponse(json)
  if (parsed === null) {
    throw new TypeError("Invalid API response: expected linked API key")
  }
  return parsed
}

export async function revokeAndRegeneratePublishableApiKey(
  existingKey: ApiKeyDto,
): Promise<{ key: ApiKeyDto; revealedToken: string }> {
  await revokeApiKey(existingKey.id)

  const created = await createPublishableApiKey(existingKey.title)
  const salesChannelIds = existingKey.sales_channels.map((channel) => channel.id)

  const linked =
    salesChannelIds.length > 0
      ? await linkApiKeyToSalesChannels(created.id, salesChannelIds)
      : created

  return { key: linked, revealedToken: created.token }
}
