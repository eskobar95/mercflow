/** Public Shipmondo read-only probe endpoint (validated credentials ⇒ HTTP 200). */
export const SHIPMONDO_SHIPMENTS_URL =
  "https://app.shipmondo.com/api/public/v3/shipments?page=1&per_page=1"

export const SHIPMONDO_PRODUCTS_URL_BASE = "https://app.shipmondo.com/api/public/v3/products"

export function resolveShipmondoApiBaseUrl(): string {
  const sandbox = process.env.SHIPMONDO_SANDBOX === "true"
  return sandbox
    ? "https://sandbox.shipmondo.com/api/public/v3"
    : "https://app.shipmondo.com/api/public/v3"
}

function buildShipmondoAuthorizationHeader(apiUser: string, apiKey: string): string {
  const credentials = `${apiUser}:${apiKey}`
  return Buffer.from(credentials, "utf8").toString("base64")
}

export type ShipmondoHttpClientDeps = {
  fetchImpl?: typeof fetch
}

export async function fetchShipmondoProductsJson(opts: {
  apiUser: string
  apiKey: string
  countryCode?: string | undefined
  fetchImpl?: typeof fetch
}): Promise<{ ok: boolean; httpStatus: number; body: unknown }> {
  const fetchFn = opts.fetchImpl ?? globalThis.fetch
  const authorization = buildShipmondoAuthorizationHeader(opts.apiUser, opts.apiKey)
  const q = new URLSearchParams()
  q.set(
    "country_code",
    typeof opts.countryCode === "string" && opts.countryCode.trim().length > 0
      ? opts.countryCode.trim().toUpperCase()
      : "DK"
  )

  const url = `${SHIPMONDO_PRODUCTS_URL_BASE}?${q.toString()}`

  let response: Response
  try {
    response = await fetchFn(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authorization}`,
      },
    })
  } catch {
    return { ok: false, httpStatus: 0, body: null }
  }

  const httpStatus = response.status
  let body: unknown = null
  if (response.headers.get("content-type")?.includes("application/json") === true) {
    body = await response.json()
  }

  const ok = httpStatus >= 200 && httpStatus < 300

  return { ok, httpStatus, body }
}

export async function probeShipmondoShipments(opts: {
  apiUser: string
  apiKey: string
  fetchImpl?: typeof fetch
}): Promise<{ ok: boolean; httpStatus: number }> {
  const fetchFn = opts.fetchImpl ?? globalThis.fetch
  const authorization = buildShipmondoAuthorizationHeader(opts.apiUser, opts.apiKey)

  let response: Response
  try {
    response = await fetchFn(SHIPMONDO_SHIPMENTS_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authorization}`,
      },
    })
  } catch {
    return { ok: false, httpStatus: 0 }
  }

  const httpStatus = response.status
  return { ok: httpStatus >= 200 && httpStatus < 300, httpStatus }
}

export async function postShipmondoShipment(opts: {
  apiUser: string
  apiKey: string
  body: Record<string, unknown>
  fetchImpl?: typeof fetch
}): Promise<{ ok: boolean; httpStatus: number; body: unknown }> {
  const fetchFn = opts.fetchImpl ?? globalThis.fetch
  const authorization = buildShipmondoAuthorizationHeader(opts.apiUser, opts.apiKey)
  const url = `${resolveShipmondoApiBaseUrl()}/shipments`

  let response: Response
  try {
    response = await fetchFn(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${authorization}`,
      },
      body: JSON.stringify(opts.body),
    })
  } catch {
    return { ok: false, httpStatus: 0, body: null }
  }

  const httpStatus = response.status
  let body: unknown = null
  if (response.headers.get("content-type")?.includes("application/json") === true) {
    body = await response.json()
  }

  return { ok: httpStatus >= 200 && httpStatus < 300, httpStatus, body }
}

export async function fetchShipmondoShipmentLabels(opts: {
  apiUser: string
  apiKey: string
  shipmentId: string | number
  fetchImpl?: typeof fetch
}): Promise<{ ok: boolean; httpStatus: number; body: unknown }> {
  const fetchFn = opts.fetchImpl ?? globalThis.fetch
  const authorization = buildShipmondoAuthorizationHeader(opts.apiUser, opts.apiKey)
  const url = `${resolveShipmondoApiBaseUrl()}/shipments/${encodeURIComponent(String(opts.shipmentId))}/labels`

  let response: Response
  try {
    response = await fetchFn(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authorization}`,
      },
    })
  } catch {
    return { ok: false, httpStatus: 0, body: null }
  }

  const httpStatus = response.status
  let body: unknown = null
  if (response.headers.get("content-type")?.includes("application/json") === true) {
    body = await response.json()
  }

  return { ok: httpStatus >= 200 && httpStatus < 300, httpStatus, body }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function extractShipmondoLabelBase64FromResponse(body: unknown): string | null {
  if (!isRecord(body)) {
    return null
  }

  const labels = body.labels
  if (Array.isArray(labels)) {
    for (const entry of labels) {
      if (!isRecord(entry)) {
        continue
      }
      const base64 = entry.base64
      if (typeof base64 === "string" && base64.trim() !== "") {
        return base64.trim()
      }
    }
  }

  const label = body.label
  if (isRecord(label)) {
    const base64 = label.base64
    if (typeof base64 === "string" && base64.trim() !== "") {
      return base64.trim()
    }
  }

  return null
}

export function extractShipmondoTrackingUrl(body: unknown): string | null {
  if (!isRecord(body)) {
    return null
  }

  const pkg = body.package
  if (isRecord(pkg)) {
    const trackingUrl = pkg.tracking_url ?? pkg.trackingUrl
    if (typeof trackingUrl === "string" && trackingUrl.trim() !== "") {
      return trackingUrl.trim()
    }
  }

  const trackingUrl = body.tracking_url ?? body.trackingUrl
  if (typeof trackingUrl === "string" && trackingUrl.trim() !== "") {
    return trackingUrl.trim()
  }

  return null
}

export function extractShipmondoErrorMessage(body: unknown, httpStatus: number): string {
  if (isRecord(body)) {
    const message = body.message ?? body.error
    if (typeof message === "string" && message.trim() !== "") {
      return message.trim()
    }
    const errors = body.errors
    if (Array.isArray(errors) && errors.length > 0) {
      const parts: string[] = []
      for (const entry of errors) {
        if (typeof entry === "string" && entry.trim() !== "") {
          parts.push(entry.trim())
        } else if (isRecord(entry)) {
          const detail = entry.message ?? entry.detail
          if (typeof detail === "string" && detail.trim() !== "") {
            parts.push(detail.trim())
          }
        }
      }
      if (parts.length > 0) {
        return parts.join("; ")
      }
    }
  }

  if (httpStatus === 0) {
    return "Unable to reach the Shipmondo API"
  }

  return `Shipmondo returned HTTP ${httpStatus}`
}
