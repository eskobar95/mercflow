import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listTeamMembers } from "../../../../lib/team/clerk-team-service"
import { resolveClerkOrgId } from "../../../../lib/team/resolve-clerk-org-id"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const organizationId = resolveClerkOrgId(req)
  const members = await listTeamMembers(organizationId)

  res.status(200).json({
    members,
    count: members.length,
  })
}
