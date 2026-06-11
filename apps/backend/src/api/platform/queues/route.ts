import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../lib/platform-auth/clerk-platform-auth-middleware"
import { getPlatformQueueMonitor } from "../../../lib/platform-queues/platform-queue-monitor"

export async function GET(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!req.platformOperator) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const monitor = getPlatformQueueMonitor()
  const queues = await monitor.listQueueStats()

  res.status(200).json({ queues })
}
