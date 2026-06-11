const DEFAULT_BACKEND_URL = "http://localhost:9000"

export function resolvePlatformBackendUrl(): string {
  const configured = import.meta.env.VITE_PLATFORM_BACKEND_URL?.trim()
  return configured && configured.length > 0 ? configured : DEFAULT_BACKEND_URL
}

async function fetchPlatformApi(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
): Promise<Response> {
  const token = await getToken()
  if (!token) {
    throw new Error("Missing Clerk session token")
  }

  const backendUrl = resolvePlatformBackendUrl()
  return fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
}

export async function fetchPlatformHealth(
  getToken: () => Promise<string | null>,
): Promise<Response> {
  return fetchPlatformApi("/platform/health", getToken)
}

export type PlatformEmailDelivery = {
  id: string
  store_id: string
  template_key: string
  to_email: string
  entity_id: string
  status: string
  error_message: string | null
  sent_at: string | null
  ses_message_id: string | null
  created_at: string
  ses_error_code: string | null
  ses_error_description: string | null
}

export type PlatformEmailDeliveriesResponse = {
  email_deliveries: PlatformEmailDelivery[]
  count: number
  limit: number
  offset: number
}

export type PlatformEmailDomain = {
  store_id: string
  domain: string | null
  from_email: string | null
  ses_domain_status: string
  ses_identity_arn: string | null
  updated_at: string
}

export type PlatformEmailDomainsResponse = {
  email_domains: PlatformEmailDomain[]
  count: number
}

export type PlatformSystemMetrics = {
  fetched_at: string
  uptime_seconds: number
  hetzner: {
    configured: boolean
    cpu_percent: number | null
    memory_gb: number | null
    memory_percent: number | null
    error: string | null
  }
  neon: {
    configured: boolean
    active_connections: number | null
    max_connections: number | null
    error: string | null
  }
  redis: {
    configured: boolean
    used_memory_bytes: number | null
    max_memory_bytes: number | null
    error: string | null
  }
}

export type PlatformAuditEntry = {
  id: string
  operator_email: string
  action: string
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export type PlatformAuditResponse = {
  audit_entries: PlatformAuditEntry[]
  count: number
  limit: number
  offset: number
}

export async function fetchPlatformEmailDeliveries(
  getToken: () => Promise<string | null>,
  params: { q?: string; limit?: number; offset?: number },
): Promise<PlatformEmailDeliveriesResponse> {
  const search = new URLSearchParams()
  if (params.q) {
    search.set("q", params.q)
  }
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit))
  }
  if (params.offset !== undefined) {
    search.set("offset", String(params.offset))
  }

  const query = search.toString()
  const response = await fetchPlatformApi(
    `/platform/email/deliveries${query ? `?${query}` : ""}`,
    getToken,
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Email deliveries API returned ${response.status}`)
  }

  return (await response.json()) as PlatformEmailDeliveriesResponse
}

export async function fetchPlatformEmailDomains(
  getToken: () => Promise<string | null>,
): Promise<PlatformEmailDomainsResponse> {
  const response = await fetchPlatformApi("/platform/email/domains", getToken)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Email domains API returned ${response.status}`)
  }

  return (await response.json()) as PlatformEmailDomainsResponse
}

export async function fetchPlatformSystemMetrics(
  getToken: () => Promise<string | null>,
): Promise<PlatformSystemMetrics> {
  const response = await fetchPlatformApi("/platform/system/metrics", getToken)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `System metrics API returned ${response.status}`)
  }

  return (await response.json()) as PlatformSystemMetrics
}

export async function fetchPlatformAuditLog(
  getToken: () => Promise<string | null>,
  params: { from?: string; to?: string; limit?: number; offset?: number },
): Promise<PlatformAuditResponse> {
  const search = new URLSearchParams()
  if (params.from) {
    search.set("from", params.from)
  }
  if (params.to) {
    search.set("to", params.to)
  }
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit))
  }
  if (params.offset !== undefined) {
    search.set("offset", String(params.offset))
  }

  const query = search.toString()
  const response = await fetchPlatformApi(
    `/platform/audit${query ? `?${query}` : ""}`,
    getToken,
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? `Audit API returned ${response.status}`)
  }

  return (await response.json()) as PlatformAuditResponse
}
