import type {
  ConnectorConnectionHealthUi,
} from "@/features/connectors/types"

export type PlunkConnectorAdminDto = {
  type: "plunk"
  configured: boolean
  active: boolean
  apiKeyMasked: string | null
  fromEmail: string | null
  fromName: string | null
  connectionHealth: ConnectorConnectionHealthUi | null
  lastTestedAt: string | null
  lastTestMessage: string | null
}

function isHealthUi(value: string): value is ConnectorConnectionHealthUi {
  return value === "ok" || value === "error" || value === "untested"
}

function parseNullableIso(raw: unknown): string | null {
  if (raw === null) {
    return null
  }
  if (typeof raw !== "string") {
    return null
  }
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : raw
}

export function parsePlunkConnectorPayload(json: unknown): PlunkConnectorAdminDto | null {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return null
  }

  const root = json as Record<string, unknown>
  const data = root["data"]
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null
  }

  const rec = data as Record<string, unknown>

  const typeRaw = rec["type"]
  const configuredRaw = rec["configured"]
  const activeRaw = rec["active"]

  if (typeRaw !== "plunk") {
    return null
  }
  if (configuredRaw !== false && configuredRaw !== true) {
    return null
  }
  if (typeof activeRaw !== "boolean") {
    return null
  }

  let connectionHealth: ConnectorConnectionHealthUi | null = null
  const healthRaw = rec["connectionHealth"]
  if (configuredRaw === true) {
    if (typeof healthRaw !== "string" || !isHealthUi(healthRaw)) {
      return null
    }
    connectionHealth = healthRaw
  } else if (healthRaw !== null && healthRaw !== undefined) {
    return null
  }

  const apiKeyMaskedRaw = rec["apiKeyMasked"]
  if (!(apiKeyMaskedRaw === null || typeof apiKeyMaskedRaw === "string")) {
    return null
  }

  const fromEmail = rec["fromEmail"]
  const fromName = rec["fromName"]
  const lastTestMessage = rec["lastTestMessage"]
  const lastTestedAtRaw = rec["lastTestedAt"]

  if (!(fromEmail === null || typeof fromEmail === "string")) {
    return null
  }
  if (!(fromName === null || typeof fromName === "string")) {
    return null
  }
  if (!(lastTestMessage === null || typeof lastTestMessage === "string")) {
    return null
  }

  return {
    type: "plunk",
    configured: configuredRaw,
    active: activeRaw,
    apiKeyMasked: apiKeyMaskedRaw,
    fromEmail,
    fromName,
    connectionHealth,
    lastTestedAt: parseNullableIso(lastTestedAtRaw),
    lastTestMessage,
  }
}
