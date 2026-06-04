import type { MedusaRequest } from "@medusajs/framework/http"

function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value
  }

  if (Array.isArray(value) && value[0]) {
    return value[0]
  }

  return undefined
}

export function resolveClientIp(req: MedusaRequest): string {
  const forwarded = firstHeaderValue(req.headers["x-forwarded-for"])

  if (forwarded) {
    const firstHop = forwarded.split(",")[0]?.trim()
    if (firstHop) {
      return firstHop
    }
  }

  if (req.ip) {
    return req.ip
  }

  const remoteAddress = req.socket?.remoteAddress
  if (remoteAddress) {
    return remoteAddress
  }

  return "unknown"
}

export function resolvePublishableApiKey(req: MedusaRequest): string {
  const publishableKey = firstHeaderValue(req.headers["x-publishable-api-key"])

  if (publishableKey) {
    return publishableKey
  }

  return `missing-key:${resolveClientIp(req)}`
}
