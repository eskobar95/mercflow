export type PlatformInviteStatus = "pending" | "redeemed" | "expired" | "revoked"

export type PlatformInviteRow = {
  id: string
  email: string
  token: string
  status: PlatformInviteStatus
  invited_by: string
  created_at: string
  expires_at: string
  redeemed_at: string | null
  tenant_id: string | null
}
