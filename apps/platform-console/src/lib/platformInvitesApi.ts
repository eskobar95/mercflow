export type PlatformInviteStatus = "pending" | "redeemed" | "expired" | "revoked"

export type PlatformInvite = {
  id: string
  email: string
  status: PlatformInviteStatus
  invited_by: string
  created_at: string
  expires_at: string
  redeemed_at: string | null
  tenant_id: string | null
}

export type CreatePlatformInviteInput = {
  email: string
}

export type CreatePlatformInviteResult = {
  invite: PlatformInvite
  token: string
  invite_url: string
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

export async function fetchPlatformInvites(
  getToken: () => Promise<string | null>,
): Promise<PlatformInvite[]> {
  const response = await authorizedFetch("/platform/invites", getToken)
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(body?.message ?? `Failed to load invites (${response.status})`)
  }

  const body = (await response.json()) as { invites: PlatformInvite[] }
  return body.invites
}

export async function createPlatformInvite(
  input: CreatePlatformInviteInput,
  getToken: () => Promise<string | null>,
): Promise<CreatePlatformInviteResult> {
  const response = await authorizedFetch("/platform/invites", getToken, {
    method: "POST",
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(body?.message ?? `Failed to send invite (${response.status})`)
  }

  return (await response.json()) as CreatePlatformInviteResult
}

export async function revokePlatformInvite(
  inviteId: string,
  getToken: () => Promise<string | null>,
): Promise<PlatformInvite> {
  const response = await authorizedFetch(
    `/platform/invites/${encodeURIComponent(inviteId)}/revoke`,
    getToken,
    {
      method: "POST",
    },
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(body?.message ?? `Failed to revoke invite (${response.status})`)
  }

  const body = (await response.json()) as { invite: PlatformInvite }
  return body.invite
}
