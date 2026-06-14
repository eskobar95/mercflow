import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../lib/platform-auth/clerk-platform-auth-middleware"
import {
  createPlatformInvite,
  listPlatformInvites,
  toPublicInvite,
} from "../../../lib/platform-db/platform-invites"
import {
  buildPlatformInviteUrl,
  sendPlatformInviteEmail,
} from "../../../lib/platform-invites/send-invite-email"
import { createPlatformInviteBodySchema } from "../../../lib/platform-invites/validators"
import { writePlatformAuditLog } from "../../../lib/platform-tenants/audit-log"
import {
  requirePlatformDatabase,
  requirePlatformOperator,
} from "../../../lib/platform-http/require-platform-operator"
import { validateBody } from "../../../lib/platform-http/validateBody"

export async function GET(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!requirePlatformOperator(req, res)) {
    return
  }

  if (!requirePlatformDatabase(res)) {
    return
  }

  try {
    const invites = await listPlatformInvites()

    res.status(200).json({
      invites: invites.map(toPublicInvite),
      count: invites.length,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list platform invites"

    if (message.includes("platform_invite") && message.includes("does not exist")) {
      res.status(503).json({
        message:
          "platform_invite table is not available yet. Run migrations from T086 tenant onboarding.",
      })
      return
    }

    res.status(500).json({ message })
  }
}

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

  const body = validateBody(createPlatformInviteBodySchema, req)

  try {
    const { invite, rawToken } = await createPlatformInvite({
      email: body.email.toLowerCase(),
      invitedBy: operator.userId,
    })

    const inviteUrl = buildPlatformInviteUrl(rawToken)

    await sendPlatformInviteEmail({
      email: invite.email,
      inviteUrl,
    })

    await writePlatformAuditLog(req.scope, {
      operator_email: operator.email,
      action: "create_invite",
      entity_type: "platform_invite",
      entity_id: invite.id,
      metadata: {
        email: invite.email,
        expires_at: invite.expires_at,
      },
    })

    res.status(201).json({
      invite: toPublicInvite(invite),
      token: rawToken,
      invite_url: inviteUrl,
    })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to create platform invite",
    })
  }
}
