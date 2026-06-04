import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import {
  parseShipmondoConnectorGetEnvelope,
  parseShipmondoTestEnvelope,
} from "./parseShipmondoConnectorResponses"
import type { ShipmondoConnectorGetDto, ShipmondoTestResultDto } from "./shipmondoTypes"

function resolveBaseUrl(): string {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (for example http://localhost:9000)."
    )
  }
  return base
}

export async function getShipmondoConnectorAdmin(): Promise<ShipmondoConnectorGetDto> {
  const base = resolveBaseUrl()

  const response = await fetch(`${base}/admin/connectors/shipmondo`, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseShipmondoConnectorGetEnvelope(json)
  if (!parsed.ok) {
    throw new TypeError(parsed.error)
  }
  return parsed.data
}

export type ShipmondoConnectorPatchPayload = Record<string, unknown>

export async function patchShipmondoConnectorAdmin(
  body: ShipmondoConnectorPatchPayload
): Promise<ShipmondoConnectorGetDto> {
  const base = resolveBaseUrl()

  const response = await fetch(`${base}/admin/connectors/shipmondo`, {
    method: "PATCH",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseShipmondoConnectorGetEnvelope(json)
  if (!parsed.ok) {
    throw new TypeError(parsed.error)
  }
  return parsed.data
}

export async function postShipmondoConnectorTest(): Promise<ShipmondoTestResultDto> {
  const base = resolveBaseUrl()

  const response = await fetch(`${base}/admin/connectors/shipmondo/test`, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseShipmondoTestEnvelope(json)

  if (!parsed.ok) {
    throw new TypeError(parsed.error)
  }

  return parsed.data
}
