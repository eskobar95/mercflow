import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listTeamInvitations, listTeamMembers } from "../../../../lib/team/clerk-team-service"
import { resolveClerkOrgId } from "../../../../lib/team/resolve-clerk-org-id"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const organizationId = resolveClerkOrgId(req)
  const [members, invitations] = await Promise.all([
    listTeamMembers(organizationId),
    listTeamInvitations(organizationId),
  ])

  res.status(200).json({
    members,
    invitations,
    count: members.length,
    pending_count: invitations.length,
  })
}
