export type PlatformTenant = {
  id: string
  name: string
  domain: string | null
  is_disabled: boolean
  created_at: string
}

export type ProvisionProgressEvent = {
  step: string
  message: string
  status: "pending" | "running" | "done" | "error"
}

export type ProvisionCompleteResult = {
  store_id: string
  sales_channel_id: string
  publishable_api_key: string
  admin_user_id: string
  admin_email: string
  admin_url: string
  tenant_url: string
}

export type ProvisionTenantInput = {
  name: string
  domain: string
  email: string
  currency: string
  timezone?: string
}

export type SuspendTenantInput = {
  reason: string
}

async function authorizedFetch(
  path: string,
  getToken: () => Promise<string | null>,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getToken()
  if (!token) {
    throw new Error("Missing Clerk session token")
  }

  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(path, { ...init, headers })
}

export async function fetchPlatformTenants(
  getToken: () => Promise<string | null>,
): Promise<PlatformTenant[]> {
  const response = await authorizedFetch("/platform/tenants", getToken)
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(body?.message ?? `Failed to load tenants (${response.status})`)
  }

  const body = (await response.json()) as { tenants: PlatformTenant[] }
  return body.tenants
}

export async function suspendPlatformTenant(
  tenantId: string,
  input: SuspendTenantInput,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const response = await authorizedFetch(
    `/platform/tenants/${encodeURIComponent(tenantId)}/suspend`,
    getToken,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(body?.message ?? `Failed to suspend tenant (${response.status})`)
  }
}

export async function provisionPlatformTenantWithProgress(
  input: ProvisionTenantInput,
  getToken: () => Promise<string | null>,
  onProgress: (event: ProvisionProgressEvent) => void,
): Promise<ProvisionCompleteResult> {
  const token = await getToken()
  if (!token) {
    throw new Error("Missing Clerk session token")
  }

  const response = await fetch("/platform/tenants/provision", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(body?.message ?? `Failed to start provisioning (${response.status})`)
  }

  if (response.body === null) {
    throw new Error("Provisioning response did not include a stream body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let completeResult: ProvisionCompleteResult | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split("\n\n")
    buffer = chunks.pop() ?? ""

    for (const chunk of chunks) {
      const lines = chunk.split("\n")
      let eventName = "message"
      let dataLine = ""

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim()
        } else if (line.startsWith("data:")) {
          dataLine = line.slice(5).trim()
        }
      }

      if (dataLine === "") {
        continue
      }

      const parsed: unknown = JSON.parse(dataLine)
      if (eventName === "progress") {
        onProgress(parsed as ProvisionProgressEvent)
      } else if (eventName === "complete") {
        completeResult = parsed as ProvisionCompleteResult
      } else if (eventName === "error") {
        const message =
          typeof parsed === "object" &&
          parsed !== null &&
          "message" in parsed &&
          typeof (parsed as { message: unknown }).message === "string"
            ? (parsed as { message: string }).message
            : "Tenant provisioning failed"
        throw new Error(message)
      }
    }
  }

  if (completeResult === null) {
    throw new Error("Provisioning finished without a completion event")
  }

  return completeResult
}
