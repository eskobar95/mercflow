import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

type MercflowAdminRequest = MedusaRequest & {
  mercflowClerkOrgId?: string
}

export function resolveClerkOrgId(req: MedusaRequest): string {
  const orgId = (req as MercflowAdminRequest).mercflowClerkOrgId
  if (typeof orgId === "string" && orgId.trim() !== "" && orgId.startsWith("org_")) {
    return orgId.trim()
  }

  throw new MedusaError(
    MedusaError.Types.UNAUTHORIZED,
    "Active Clerk organization is required",
  )
}
