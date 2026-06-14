import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { validateBody } from "../../../../lib/platform-http/validateBody"
import { inviteTeamMember } from "../../../../lib/team/clerk-team-service"
import { resolveClerkOrgId } from "../../../../lib/team/resolve-clerk-org-id"
import { inviteTeamMemberBodySchema } from "../../../../lib/team/schemas"

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const body = validateBody(inviteTeamMemberBodySchema, req)
  const organizationId = resolveClerkOrgId(req)

  const invitation = await inviteTeamMember({
    organizationId,
    email: body.email,
    role: body.role,
  })

  res.status(200).json({
    invitation,
  })
}
