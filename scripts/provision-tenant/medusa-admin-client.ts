type MedusaAdminClientOptions = {
  readonly backendUrl: string
  readonly adminApiToken: string
}

export class MedusaAdminRequestError extends Error {
  readonly name = "MedusaAdminRequestError"
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function buildAdminHeaders(adminApiToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${adminApiToken}`,
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const parsed: unknown = JSON.parse(text)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
    ) {
      return (parsed as { message: string }).message
    }
  } catch {
    // fall through
  }
  return text.trim() === "" ? `${response.status} ${response.statusText}` : text
}

async function adminFetch(
  options: MedusaAdminClientOptions,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers)
  const defaults = buildAdminHeaders(options.adminApiToken)
  for (const [key, value] of Object.entries(defaults)) {
    if (!headers.has(key)) {
      headers.set(key, value)
    }
  }

  return fetch(`${options.backendUrl}${path}`, {
    ...init,
    headers,
  })
}

async function adminJson<T>(
  options: MedusaAdminClientOptions,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await adminFetch(options, path, init)
  if (!response.ok) {
    throw new MedusaAdminRequestError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as T
}

export async function createSalesChannel(
  options: MedusaAdminClientOptions,
  name: string,
): Promise<{ id: string }> {
  const body = await adminJson<{ sales_channel: { id: string } }>(
    options,
    "/admin/sales-channels",
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
  )
  return { id: body.sales_channel.id }
}

export async function updateStoreDefaultSalesChannel(
  options: MedusaAdminClientOptions,
  storeId: string,
  salesChannelId: string,
): Promise<void> {
  await adminJson(options, `/admin/stores/${storeId}`, {
    method: "POST",
    body: JSON.stringify({ default_sales_channel_id: salesChannelId }),
  })
}

export async function createPublishableApiKey(
  options: MedusaAdminClientOptions,
  title: string,
): Promise<{ id: string; token: string }> {
  const body = await adminJson<{ api_key: { id: string; token: string } }>(
    options,
    "/admin/api-keys",
    {
      method: "POST",
      body: JSON.stringify({ title, type: "publishable" }),
    },
  )
  return {
    id: body.api_key.id,
    token: body.api_key.token,
  }
}

export async function linkPublishableKeyToSalesChannel(
  options: MedusaAdminClientOptions,
  apiKeyId: string,
  salesChannelId: string,
): Promise<void> {
  await adminJson(options, `/admin/api-keys/${apiKeyId}/sales-channels`, {
    method: "POST",
    body: JSON.stringify({ add: [salesChannelId] }),
  })
}

type InviteResponse = {
  invite: {
    id: string
    token: string
    email: string
  }
}

export async function createAdminInvite(
  options: MedusaAdminClientOptions,
  email: string,
): Promise<{ token: string }> {
  const body = await adminJson<InviteResponse>(options, "/admin/invites", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
  return { token: body.invite.token }
}

export async function registerAdminAuthIdentity(
  backendUrl: string,
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(`${backendUrl}/auth/user/emailpass/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new MedusaAdminRequestError(
      await readErrorMessage(response),
      response.status,
    )
  }

  const body = (await response.json()) as { token?: string }
  if (typeof body.token !== "string" || body.token.trim() === "") {
    throw new MedusaAdminRequestError(
      "Auth register succeeded but no JWT token was returned",
      response.status,
    )
  }
  return body.token
}

export async function acceptAdminInvite(
  backendUrl: string,
  input: {
    readonly email: string
    readonly firstName: string
    readonly lastName: string
    readonly inviteToken: string
    readonly userJwt: string
  },
): Promise<{ userId: string }> {
  const response = await fetch(
    `${backendUrl}/admin/invites/accept?token=${encodeURIComponent(input.inviteToken)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.userJwt}`,
      },
      body: JSON.stringify({
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
      }),
    },
  )

  if (!response.ok) {
    throw new MedusaAdminRequestError(
      await readErrorMessage(response),
      response.status,
    )
  }

  const body = (await response.json()) as { user: { id: string } }
  return { userId: body.user.id }
}
