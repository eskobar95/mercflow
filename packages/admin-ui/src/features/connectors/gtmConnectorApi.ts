import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import type { GtmConnectorAdminDto } from "./types"

function parseGtmAdminResponsePayload(
  json: unknown
): GtmConnectorAdminDto | null {
  if (typeof json !== "object" || json === null || !("container_id" in json)) {
    return null
  }
  const raw = (json as Record<string, unknown>).container_id
  if (raw !== null && typeof raw !== "string") {
    return null
  }
  return { container_id: raw }
}

export async function getAdminGtmConnector(): Promise<GtmConnectorAdminDto> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const response = await fetch(`${base}/admin/connectors/gtm`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseGtmAdminResponsePayload(json)
  if (parsed === null) {
    throw new TypeError(
      'Invalid API response: expected JSON object with "container_id"'
    )
  }
  return parsed
}

export async function patchAdminGtmConnector(payload: {
  container_id: string
}): Promise<GtmConnectorAdminDto> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }

  const response = await fetch(`${base}/admin/connectors/gtm`, {
    method: "PATCH",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseGtmAdminResponsePayload(json)
  if (parsed === null) {
    throw new TypeError(
      'Invalid API response: expected JSON object with "container_id"'
    )
  }
  return parsed
}
