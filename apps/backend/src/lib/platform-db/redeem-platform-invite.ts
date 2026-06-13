import { getPlatformDbPool } from "../platform-db/platform-db"
import { hashInviteToken } from "../platform-invites/token"

export async function redeemPlatformInvite(input: {
  rawToken: string
  tenantId: string
}): Promise<boolean> {
  const hashedToken = hashInviteToken(input.rawToken)
  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<{ id: string }>(
      `UPDATE platform_invite
       SET status = 'redeemed',
           redeemed_at = NOW(),
           tenant_id = $2
       WHERE token = $1
         AND status = 'pending'
         AND expires_at > NOW()
       RETURNING id`,
      [hashedToken, input.tenantId],
    )

    return result.rowCount !== null && result.rowCount > 0
  } finally {
    client.release()
  }
}

export async function redeemPlatformInviteByTokenHash(input: {
  inviteTokenHash: string
  tenantId: string
}): Promise<boolean> {
  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<{ id: string }>(
      `UPDATE platform_invite
       SET status = 'redeemed',
           redeemed_at = NOW(),
           tenant_id = $2
       WHERE token = $1
         AND status = 'pending'
       RETURNING id`,
      [input.inviteTokenHash, input.tenantId],
    )

    return result.rowCount !== null && result.rowCount > 0
  } finally {
    client.release()
  }
}

export async function findTenantIdByInviteTokenHash(
  inviteTokenHash: string,
): Promise<string | null> {
  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<{ tenant_id: string | null }>(
      `SELECT tenant_id
       FROM platform_invite
       WHERE token = $1
       LIMIT 1`,
      [inviteTokenHash],
    )

    return result.rows[0]?.tenant_id ?? null
  } finally {
    client.release()
  }
}
