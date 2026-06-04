function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseCredentialFlags(raw: unknown): {
  apiUserConfigured: boolean
  apiKeyConfigured: boolean
  shippingModuleKeyConfigured: boolean
} {
  if (!isRecord(raw)) {
    return {
      apiUserConfigured: false,
      apiKeyConfigured: false,
      shippingModuleKeyConfigured: false,
    }
  }

  return {
    apiUserConfigured: raw.apiUserConfigured === true,
    apiKeyConfigured: raw.apiKeyConfigured === true,
    shippingModuleKeyConfigured: raw.shippingModuleKeyConfigured === true,
  }
}

function parseLogs(
  raw: unknown
): Array<{ id: string; createdAt: string; message: string; success: boolean }> {
  if (!Array.isArray(raw)) {
    return []
  }

  const out: Array<{
    id: string
    createdAt: string
    message: string
    success: boolean
  }> = []

  for (const item of raw) {
    if (!isRecord(item)) {
      continue
    }
    if (typeof item.id !== "string") {
      continue
    }

    const createdAtRaw = item.createdAt
    const createdAt =
      typeof createdAtRaw === "string" && Number.isFinite(new Date(createdAtRaw).getTime())
        ? createdAtRaw
        : null

    if (createdAt === null) {
      continue
    }

    const message = typeof item.message === "string" ? item.message : "Log entry"

    const success = item.success === true

    out.push({
      id: item.id,
      createdAt,
      message,
      success,
    })
  }

  return out
}

export function parseShipmondoConnectorGetEnvelope(json: unknown): {
  ok: false
  error: string
} | {
  ok: true
  data: {
    type: "shipmondo"
    active: boolean
    lastTestedAt: string | null
    credentials: {
      apiUserConfigured: boolean
      apiKeyConfigured: boolean
      shippingModuleKeyConfigured: boolean
    }
    recentLogs: Array<{
      id: string
      createdAt: string
      message: string
      success: boolean
    }>
  }
} {
  if (!isRecord(json)) {
    return { ok: false, error: "Expected JSON object" }
  }

  const data = json.data
  if (!isRecord(data)) {
    return { ok: false, error: "Missing data object" }
  }

  const typeRaw = typeof data.type === "string" ? data.type.toLowerCase() : ""
  if (typeRaw !== "shipmondo") {
    return { ok: false, error: "Unexpected connector payload" }
  }

  const active = data.active === true

  let lastTestedAt: string | null = null
  if (
    typeof data.lastTestedAt === "string" &&
    Number.isFinite(new Date(data.lastTestedAt).getTime())
  ) {
    lastTestedAt = data.lastTestedAt
  } else if (data.lastTestedAt === null) {
    lastTestedAt = null
  }

  const credentials = parseCredentialFlags(data.credentials)
  const recentLogs = parseLogs(data.recentLogs)

  return {
    ok: true,
    data: {
      type: "shipmondo",
      active,
      lastTestedAt,
      credentials,
      recentLogs,
    },
  }
}

export function parseShipmondoTestEnvelope(json: unknown): {
  ok: false
  error: string
} | {
  ok: true
  data: { success: boolean; message?: string; error?: string }
} {
  if (!isRecord(json)) {
    return { ok: false, error: "Expected JSON object" }
  }

  if (typeof json.success !== "boolean") {
    return { ok: false, error: "Missing boolean success flag" }
  }

  const success = json.success === true
  const message = typeof json.message === "string" ? json.message : undefined
  const error = typeof json.error === "string" ? json.error : undefined

  return { ok: true, data: { success, message, error } }
}
