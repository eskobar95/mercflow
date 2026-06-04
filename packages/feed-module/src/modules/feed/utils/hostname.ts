/**
 * Normalizes a Host header or URL host to lowercase hostname without port.
 */
export function normalizeHostname(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase()
  if (trimmed.length === 0) {
    return null
  }
  try {
    if (trimmed.includes("://")) {
      const url = new URL(trimmed)
      const host = url.hostname.trim().toLowerCase()
      return host.length > 0 ? host : null
    }
  } catch {
    // fall through — treat as bare host
  }
  const withoutPort = trimmed.split(":")[0] ?? trimmed
  const host = withoutPort.replace(/\/+$/, "").trim()
  return host.length > 0 ? host : null
}

/**
 * Extracts hostname from a storefront base URL for Host header matching.
 */
export function hostnameFromStorefrontUrl(storefrontUrl: string): string | null {
  const trimmed = storefrontUrl.trim()
  if (trimmed.length === 0) {
    return null
  }
  try {
    const withScheme = trimmed.includes("://") ? trimmed : `https://${trimmed}`
    return normalizeHostname(new URL(withScheme).host)
  } catch {
    return normalizeHostname(trimmed)
  }
}

export function hostsMatchStorefront(storefrontUrl: string, requestHost: string): boolean {
  const configured = hostnameFromStorefrontUrl(storefrontUrl)
  const incoming = normalizeHostname(requestHost)
  if (!configured || !incoming) {
    return false
  }
  return configured === incoming
}
