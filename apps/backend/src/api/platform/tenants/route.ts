import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../lib/platform-auth/clerk-platform-auth-middleware"
import { isPlatformDbConfigured } from "../../../lib/platform-db/platform-db"
import { listPlatformTenants } from "../../../lib/platform-tenants/list-tenants"

export async function GET(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!req.platformOperator) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  if (!isPlatformDbConfigured()) {
    res.status(503).json({
      message:
        "Platform database is not configured. Set PLATFORM_DATABASE_URL on the backend.",
    })
    return
  }

  try {
    const tenants = await listPlatformTenants()
    res.status(200).json({ tenants })
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to list platform tenants",
    })
  }
}
