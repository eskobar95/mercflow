import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { validateBody, validateParams } from "../../../../../lib/platform-http/validateBody"
import {
  revokeTeamMember,
  updateTeamMemberRole,
} from "../../../../../lib/team/clerk-team-service"
import { resolveClerkOrgId } from "../../../../../lib/team/resolve-clerk-org-id"
import {
  teamMemberParamsSchema,
  updateTeamMemberRoleBodySchema,
} from "../../../../../lib/team/schemas"

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const params = validateParams(teamMemberParamsSchema, req.params)
  const body = validateBody(updateTeamMemberRoleBodySchema, req)
  const organizationId = resolveClerkOrgId(req)

  const member = await updateTeamMemberRole({
    organizationId,
    clerkUserId: params.clerk_user_id,
    role: body.role,
  })

  res.status(200).json({ member })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const params = validateParams(teamMemberParamsSchema, req.params)
  const organizationId = resolveClerkOrgId(req)

  await revokeTeamMember({
    organizationId,
    clerkUserId: params.clerk_user_id,
  })

  res.status(200).json({ deleted: true })
}
