import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { RobotsConfigDto, RobotsRuleDto } from "./types"

function parseRobotsConfig(json: unknown): { config: RobotsConfigDto; preview: string } | null {
  if (typeof json !== "object" || json === null) {
    return null
  }
  const record = json as Record<string, unknown>
  if (!("robots_config" in record) || typeof record.preview !== "string") {
    return null
  }
  const raw = record.robots_config
  if (typeof raw !== "object" || raw === null) {
    return null
  }
  const row = raw as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.store_id !== "string") {
    return null
  }
  const structured =
    typeof row.structured_rules === "object" &&
    row.structured_rules !== null &&
    !Array.isArray(row.structured_rules) &&
    Array.isArray((row.structured_rules as { rules?: unknown }).rules)
      ? (row.structured_rules as RobotsConfigDto["structured_rules"])
      : { rules: [] }
  return {
    config: {
      id: row.id,
      store_id: row.store_id,
      structured_rules: structured,
      freetext_override:
        row.freetext_override === null || typeof row.freetext_override === "string"
          ? (row.freetext_override as string | null)
          : null,
      change_history: Array.isArray(row.change_history)
        ? (row.change_history as RobotsConfigDto["change_history"])
        : [],
    },
    preview: record.preview,
  }
}

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return fetch(`${base}${path}`, {
    credentials: "include",
    headers: buildMedusaAdminJsonHeaders(),
    ...init,
  })
}

export async function getAdminRobotsConfig(): Promise<{
  config: RobotsConfigDto
  preview: string
}> {
  const response = await adminFetch("/admin/robots-config", { method: "GET" })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseRobotsConfig(json)
  if (parsed === null) {
    throw new TypeError('Invalid API response: expected { robots_config, preview }')
  }
  return parsed
}

export async function putAdminRobotsConfig(payload: {
  structured_rules?: { rules: RobotsRuleDto[] }
  freetext_override?: string | null
  change_summary?: string
}): Promise<{ config: RobotsConfigDto; preview: string }> {
  const response = await adminFetch("/admin/robots-config", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseRobotsConfig(json)
  if (parsed === null) {
    throw new TypeError('Invalid API response: expected { robots_config, preview }')
  }
  return parsed
}
