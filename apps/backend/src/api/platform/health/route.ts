import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../lib/platform-auth/clerk-platform-auth-middleware"
import {
  getPlatformDbRoleInfo,
  isPlatformDbConfigured,
  type PlatformDbUnconfigured,
} from "../../../lib/platform-db/platform-db"

type HealthResponse = {
  ok: true
  operator: {
    userId: string
    email: string
  }
  db: PlatformDbUnconfigured | Awaited<ReturnType<typeof getPlatformDbRoleInfo>>
}

export async function GET(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  const operator = req.platformOperator
  if (!operator) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const db = isPlatformDbConfigured()
    ? await getPlatformDbRoleInfo()
    : ({ configured: false } satisfies PlatformDbUnconfigured)

  const body: HealthResponse = {
    ok: true,
    operator,
    db,
  }

  res.status(200).json(body)
}
