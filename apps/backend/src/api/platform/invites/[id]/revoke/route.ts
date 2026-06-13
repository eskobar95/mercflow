import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../../lib/platform-auth/clerk-platform-auth-middleware"
import {
  getPlatformInviteById,
  revokePlatformInvite,
  toPublicInvite,
} from "../../../../../lib/platform-db/platform-invites"
import { platformInviteIdParamsSchema } from "../../../../../lib/platform-invites/validators"
import { writePlatformAuditLog } from "../../../../../lib/platform-tenants/audit-log"
import { sendPlatformZodError } from "../../../../../lib/platform-http/list-query"
import {
  requirePlatformDatabase,
  requirePlatformOperator,
} from "../../../../../lib/platform-http/require-platform-operator"

export async function POST(
  req: PlatformAuthRequest & MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const operator = requirePlatformOperator(req, res)
  if (!operator) {
    return
  }

  if (!requirePlatformDatabase(res)) {
    return
  }

  const parsed = platformInviteIdParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    sendPlatformZodError(res, parsed.error)
    return
  }

  try {
    const existing = await getPlatformInviteById(parsed.data.id)
    if (existing === null) {
      res.status(404).json({ message: `Invite not found: ${parsed.data.id}` })
      return
    }

    if (existing.status !== "pending") {
      res.status(409).json({
        message: `Invite cannot be revoked while status is ${existing.status}`,
      })
      return
    }

    const revoked = await revokePlatformInvite(parsed.data.id)
    if (revoked === null) {
      res.status(409).json({ message: "Invite is no longer pending" })
      return
    }

    await writePlatformAuditLog(req.scope, {
      operator_email: operator.email,
      action: "revoke_invite",
      entity_type: "platform_invite",
      entity_id: revoked.id,
      metadata: {
        email: revoked.email,
      },
    })

    res.status(200).json({
      invite: toPublicInvite(revoked),
    })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to revoke platform invite",
    })
  }
}
