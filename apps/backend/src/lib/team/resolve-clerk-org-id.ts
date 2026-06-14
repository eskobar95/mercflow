import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

type MercflowAdminRequest = MedusaRequest & {
  mercflowStoreId?: string
}

export function resolveClerkOrgId(req: MedusaRequest): string {
  const orgId = (req as MercflowAdminRequest).mercflowStoreId
  if (typeof orgId === "string" && orgId.trim() !== "") {
    return orgId.trim()
  }

  throw new MedusaError(
    MedusaError.Types.UNAUTHORIZED,
    "Active Clerk organization is required",
  )
}
