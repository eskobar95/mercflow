import { resolvePlatformBackendUrl } from "@/lib/platformApi"

export type ValidatePlatformInviteResponse = {
  valid: boolean
  email: string | null
  store_name: string | null
}

export async function validatePlatformInviteToken(
  token: string,
): Promise<ValidatePlatformInviteResponse> {
  const backendUrl = resolvePlatformBackendUrl()
  const search = new URLSearchParams({ token })
  const response = await fetch(
    `${backendUrl}/platform/invites/validate?${search.toString()}`,
  )

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string
    } | null
    throw new Error(body?.message ?? `Invite validation failed (${response.status})`)
  }

  return (await response.json()) as ValidatePlatformInviteResponse
}
