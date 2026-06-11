import type { MedusaResponse } from "@medusajs/framework/http"

import type {
  PlatformAuthRequest,
  PlatformOperator,
} from "../platform-auth/clerk-platform-auth-middleware"
import { isPlatformDbConfigured } from "../platform-db/platform-db"

export function requirePlatformOperator(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): PlatformOperator | null {
  const operator = req.platformOperator
  if (!operator) {
    res.status(401).json({ message: "Unauthorized" })
    return null
  }
  return operator
}

export function requirePlatformDatabase(
  res: MedusaResponse,
): boolean {
  if (!isPlatformDbConfigured()) {
    res.status(503).json({
      message:
        "Platform database is not configured. Set PLATFORM_DATABASE_URL on the backend.",
    })
    return false
  }
  return true
}
