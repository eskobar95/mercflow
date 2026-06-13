import { randomUUID } from "node:crypto"

import { getPlatformDbPool } from "../platform-db/platform-db"
import {
  generateInviteToken,
  getInviteExpiresAt,
  hashInviteToken,
} from "../platform-invites/token"
import type { PlatformInviteRow, PlatformInviteStatus } from "../platform-invites/types"

type DbInviteRow = {
  id: string
  email: string
  token: string
  status: PlatformInviteStatus
  invited_by: string
  created_at: Date
  expires_at: Date
  redeemed_at: Date | null
  tenant_id: string | null
}

function mapInviteRow(row: DbInviteRow): PlatformInviteRow {
  return {
    id: row.id,
    email: row.email,
    token: row.token,
    status: row.status,
    invited_by: row.invited_by,
    created_at: row.created_at.toISOString(),
    expires_at: row.expires_at.toISOString(),
    redeemed_at: row.redeemed_at?.toISOString() ?? null,
    tenant_id: row.tenant_id,
  }
}

export function resolveEffectiveInviteStatus(
  status: PlatformInviteStatus,
  expiresAt: Date,
  now: Date = new Date(),
): PlatformInviteStatus {
  if (status === "pending" && expiresAt.getTime() <= now.getTime()) {
    return "expired"
  }

  return status
}

export async function expireStalePendingInvites(): Promise<void> {
  const client = await getPlatformDbPool().connect()

  try {
    await client.query(
      `UPDATE platform_invite
       SET status = 'expired'
       WHERE status = 'pending'
         AND expires_at <= NOW()`,
    )
  } finally {
    client.release()
  }
}

export async function listPlatformInvites(): Promise<PlatformInviteRow[]> {
  await expireStalePendingInvites()

  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<DbInviteRow>(
      `SELECT
         id,
         email,
         token,
         status,
         invited_by,
         created_at,
         expires_at,
         redeemed_at,
         tenant_id
       FROM platform_invite
       ORDER BY created_at DESC`,
    )

    return result.rows.map(mapInviteRow)
  } finally {
    client.release()
  }
}

export type CreatePlatformInviteResult = {
  invite: PlatformInviteRow
  rawToken: string
}

export async function createPlatformInvite(input: {
  email: string
  invitedBy: string
}): Promise<CreatePlatformInviteResult> {
  const rawToken = generateInviteToken()
  const hashedToken = hashInviteToken(rawToken)
  const id = randomUUID()
  const expiresAt = getInviteExpiresAt()

  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<DbInviteRow>(
      `INSERT INTO platform_invite (
         id,
         email,
         token,
         status,
         invited_by,
         expires_at
       ) VALUES ($1, $2, $3, 'pending', $4, $5)
       RETURNING
         id,
         email,
         token,
         status,
         invited_by,
         created_at,
         expires_at,
         redeemed_at,
         tenant_id`,
      [id, input.email, hashedToken, input.invitedBy, expiresAt.toISOString()],
    )

    const row = result.rows[0]
    if (!row) {
      throw new Error("Failed to create platform invite")
    }

    return {
      invite: mapInviteRow(row),
      rawToken,
    }
  } finally {
    client.release()
  }
}

export async function getPlatformInviteById(
  inviteId: string,
): Promise<PlatformInviteRow | null> {
  await expireStalePendingInvites()

  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<DbInviteRow>(
      `SELECT
         id,
         email,
         token,
         status,
         invited_by,
         created_at,
         expires_at,
         redeemed_at,
         tenant_id
       FROM platform_invite
       WHERE id = $1`,
      [inviteId],
    )

    const row = result.rows[0]
    return row ? mapInviteRow(row) : null
  } finally {
    client.release()
  }
}

export async function revokePlatformInvite(
  inviteId: string,
): Promise<PlatformInviteRow | null> {
  await expireStalePendingInvites()

  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<DbInviteRow>(
      `UPDATE platform_invite
       SET status = 'revoked'
       WHERE id = $1
         AND status = 'pending'
       RETURNING
         id,
         email,
         token,
         status,
         invited_by,
         created_at,
         expires_at,
         redeemed_at,
         tenant_id`,
      [inviteId],
    )

    const row = result.rows[0]
    return row ? mapInviteRow(row) : null
  } finally {
    client.release()
  }
}

export type ValidatePlatformInviteResult = {
  valid: boolean
  email: string | null
  store_name: string | null
}

export async function validatePlatformInviteToken(
  rawToken: string,
): Promise<ValidatePlatformInviteResult> {
  await expireStalePendingInvites()

  const hashedToken = hashInviteToken(rawToken)
  const client = await getPlatformDbPool().connect()

  try {
    const result = await client.query<DbInviteRow & { store_name: string | null }>(
      `SELECT
         pi.id,
         pi.email,
         pi.token,
         pi.status,
         pi.invited_by,
         pi.created_at,
         pi.expires_at,
         pi.redeemed_at,
         pi.tenant_id,
         s.name AS store_name
       FROM platform_invite pi
       LEFT JOIN store s
         ON s.id = pi.tenant_id
         AND s.deleted_at IS NULL
       WHERE pi.token = $1`,
      [hashedToken],
    )

    const row = result.rows[0]
    if (!row) {
      return { valid: false, email: null, store_name: null }
    }

    const effectiveStatus = resolveEffectiveInviteStatus(row.status, row.expires_at)
    if (effectiveStatus !== "pending") {
      return { valid: false, email: row.email, store_name: row.store_name }
    }

    return {
      valid: true,
      email: row.email,
      store_name: row.store_name,
    }
  } finally {
    client.release()
  }
}

export function toPublicInvite(
  invite: PlatformInviteRow,
): Omit<PlatformInviteRow, "token"> {
  return {
    id: invite.id,
    email: invite.email,
    status: invite.status,
    invited_by: invite.invited_by,
    created_at: invite.created_at,
    expires_at: invite.expires_at,
    redeemed_at: invite.redeemed_at,
    tenant_id: invite.tenant_id,
  }
}
