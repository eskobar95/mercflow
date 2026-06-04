import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { RedirectDto } from "./types"

function parseRedirectRow(raw: unknown): RedirectDto | null {
  if (typeof raw !== "object" || raw === null) {
    return null
  }
  const row = raw as Record<string, unknown>
  if (
    typeof row.id !== "string" ||
    typeof row.store_id !== "string" ||
    typeof row.from_path !== "string" ||
    typeof row.to_path !== "string"
  ) {
    return null
  }
  const type = row.type
  if (type !== "auto" && type !== "manual") {
    return null
  }
  return {
    id: row.id,
    store_id: row.store_id,
    from_path: row.from_path,
    to_path: row.to_path,
    type,
    has_chain_warning:
      typeof row.has_chain_warning === "boolean" ? row.has_chain_warning : undefined,
  }
}

export async function listAdminRedirects(): Promise<RedirectDto[]> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const response = await fetch(`${base}/admin/redirects`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  if (typeof json !== "object" || json === null || !("redirects" in json)) {
    throw new TypeError('Invalid API response: expected { redirects: array }')
  }
  const rows = (json as Record<string, unknown>).redirects
  if (!Array.isArray(rows)) {
    throw new TypeError('Invalid API response: expected { redirects: array }')
  }
  return rows
    .map((row) => parseRedirectRow(row))
    .filter((row): row is RedirectDto => row !== null)
}

export async function createAdminRedirect(payload: {
  from_path: string
  to_path: string
}): Promise<RedirectDto> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const response = await fetch(`${base}/admin/redirects`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({ ...payload, type: "manual" }),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  if (typeof json !== "object" || json === null || !("redirect" in json)) {
    throw new TypeError('Invalid API response: expected { redirect: object }')
  }
  const parsed = parseRedirectRow((json as Record<string, unknown>).redirect)
  if (parsed === null) {
    throw new TypeError('Invalid API response: expected { redirect: object }')
  }
  return parsed
}

export async function deleteAdminRedirect(id: string): Promise<void> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const response = await fetch(`${base}/admin/redirects/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
}
