import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import { parsePlunkConnectorPayload } from "./parsePlunkConnectorResponse"
import type { PlunkConnectorAdminDto } from "./parsePlunkConnectorResponse"

export type PatchPlunkConnectorPayload = {
  api_key?: string
  from_email?: string | null
  from_name?: string | null
  active?: boolean
}

async function backendOrigin(): Promise<string> {
  const base = resolveMedusaAdminBackendUrl()
  if (base === null) {
    throw new Error(
      "Missing VITE_MEDUSA_ADMIN_BACKEND_URL. Set it to your Medusa backend origin (e.g. http://localhost:9000)."
    )
  }
  return base
}

export async function getPlunkConnectorAdmin(): Promise<PlunkConnectorAdminDto> {
  const base = await backendOrigin()
  const url = `${base}/admin/connectors/plunk`
  const response = await fetch(url, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parsePlunkConnectorPayload(json)
  if (parsed === null) {
    throw new TypeError("Unexpected Plunk connector response shape.")
  }
  return parsed
}

export async function patchPlunkConnectorAdmin(
  patch: PatchPlunkConnectorPayload
): Promise<PlunkConnectorAdminDto> {
  const base = await backendOrigin()
  const url = `${base}/admin/connectors/plunk`
  const response = await fetch(url, {
    method: "PATCH",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(patch),
  })
  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }
  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parsePlunkConnectorPayload(json)
  if (parsed === null) {
    throw new TypeError("Unexpected Plunk connector response shape.")
  }
  return parsed
}

export type PlunkTestResultDto = {
  success: boolean
  message: string
}

export async function postPlunkConnectorTest(body: {
  test_email?: string
}): Promise<PlunkTestResultDto> {
  const base = await backendOrigin()
  const url = `${base}/admin/connectors/plunk/test`
  const response = await fetch(url, {
    method: "POST",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  })

  const text = await response.text()
  let parsedUnknown: unknown = {}
  if (text.trim() !== "") {
    try {
      parsedUnknown = JSON.parse(text) as unknown
    } catch {
      throw new Error(await readMedusaAdminHttpErrorMessage(response))
    }
  }

  if (typeof parsedUnknown !== "object" || parsedUnknown === null || Array.isArray(parsedUnknown)) {
    throw new TypeError("Unexpected Plunk connection test response shape.")
  }

  const rec = parsedUnknown as Record<string, unknown>
  const success = rec["success"]
  const message = rec["message"]
  if (typeof success !== "boolean" || typeof message !== "string") {
    if (!response.ok) {
      throw new Error(await readMedusaAdminHttpErrorMessage(response))
    }
    throw new TypeError("Unexpected Plunk connection test response shape.")
  }

  return { success, message }
}
