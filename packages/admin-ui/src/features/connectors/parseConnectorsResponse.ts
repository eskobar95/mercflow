import {
  CONNECTOR_SLUGS,
  type ConnectorAppStatus,
  type ConnectorConnectionHealthUi,
  type ConnectorListItemDto,
  type ConnectorSlug,
} from "./types"

function isConnectorSlug(value: string): value is ConnectorSlug {
  return (CONNECTOR_SLUGS as readonly string[]).includes(value)
}

function isHealthUi(value: string): value is ConnectorConnectionHealthUi {
  return value === "ok" || value === "error" || value === "untested"
}

function isAppStatus(value: string): value is ConnectorAppStatus {
  return value === "connected" || value === "error" || value === "not_configured"
}

function parseConnectorItem(value: unknown): ConnectorListItemDto | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }
  const rec = value as Record<string, unknown>
  const typeRaw = rec["type"]
  const activeRaw = rec["active"]
  const configuredRaw = rec["configured"]
  const lastRaw = rec["lastTestedAt"]
  const healthRaw = rec["connectionHealth"]
  const statusRaw = rec["status"]

  if (typeof typeRaw !== "string" || !isConnectorSlug(typeRaw.trim())) {
    return null
  }
  const type = typeRaw.trim() as ConnectorSlug
  if (typeof activeRaw !== "boolean" || typeof configuredRaw !== "boolean") {
    return null
  }
  if (lastRaw !== null && typeof lastRaw !== "string") {
    return null
  }

  let connectionHealth: ConnectorConnectionHealthUi | null = null
  if (configuredRaw === true) {
    if (typeof healthRaw !== "string" || !isHealthUi(healthRaw)) {
      return null
    }
    connectionHealth = healthRaw
  } else if (healthRaw !== null && healthRaw !== undefined) {
    return null
  }

  if (typeof statusRaw !== "string" || !isAppStatus(statusRaw)) {
    return null
  }

  return {
    type,
    active: activeRaw,
    configured: configuredRaw,
    lastTestedAt: lastRaw,
    connectionHealth,
    status: statusRaw,
  }
}

export function parseConnectorsResponse(json: unknown): ConnectorListItemDto[] | null {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return null
  }
  const rec = json as Record<string, unknown>
  const connectors = rec["connectors"]
  if (!Array.isArray(connectors)) {
    return null
  }
  const parsed: ConnectorListItemDto[] = []
  for (const item of connectors) {
    const row = parseConnectorItem(item)
    if (row === null) {
      return null
    }
    parsed.push(row)
  }
  if (parsed.length !== CONNECTOR_SLUGS.length) {
    return null
  }
  const sortedExpected = CONNECTOR_SLUGS.toSorted()
  const sortedActual = parsed.map((p) => p.type).toSorted()
  if (sortedExpected.join("|") !== sortedActual.join("|")) {
    return null
  }
  return parsed
}
