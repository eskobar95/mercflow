import {
  buildMedusaAdminJsonHeaders,
  parseMedusaAdminJsonResponse,
  readMedusaAdminHttpErrorMessage,
  resolveMedusaAdminBackendUrl,
} from "@/medusa-admin/medusaAdminFetch"

import {
  parseShipmondoCarrierProductsGetEnvelope,
  parseShipmondoConnectorGetEnvelope,
  parseShipmondoRulesPatchEnvelope,
  parseShipmondoTestEnvelope,
} from "./parseShipmondoConnectorResponses"
import type {
  ShipmondoCarrierProductDto,
  ShipmondoConnectorGetDto,
  ShipmondoShippingRulesDto,
  ShipmondoTestResultDto,
} from "./shipmondoTypes"

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

type ShipmondoConnectorPatchPayload = Record<string, unknown>

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

export async function getShipmondoCarrierProductsAdmin(opts?: {
  countryCode?: string
}): Promise<ShipmondoCarrierProductDto[]> {
  const base = resolveBaseUrl()
  const q =
    opts?.countryCode !== undefined &&
    opts.countryCode.trim().length === 2
      ? new URLSearchParams({ country_code: opts.countryCode.trim().toUpperCase() }).toString()
      : null
  const path =
    q === null ? `${base}/admin/connectors/shipmondo/carriers` : `${base}/admin/connectors/shipmondo/carriers?${q}`

  const response = await fetch(path, {
    method: "GET",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseShipmondoCarrierProductsGetEnvelope(json)
  if (!parsed.ok) {
    throw new TypeError(parsed.error)
  }

  return parsed.data
}

export async function patchShipmondoShippingRulesAdmin(
  body: ShipmondoShippingRulesDto
): Promise<ShipmondoShippingRulesDto> {
  const base = resolveBaseUrl()

  const response = await fetch(`${base}/admin/connectors/shipmondo/rules`, {
    method: "PATCH",
    headers: buildMedusaAdminJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readMedusaAdminHttpErrorMessage(response))
  }

  const json = await parseMedusaAdminJsonResponse(response)
  const parsed = parseShipmondoRulesPatchEnvelope(json)

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
