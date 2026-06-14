import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../../../../lib/platform-auth/clerk-platform-auth-middleware"
import {
  getPlatformQueueMonitor,
  PlatformQueueMonitorError,
} from "../../../../../../../lib/platform-queues/platform-queue-monitor"
import { resolvePlatformQueueDefinition } from "../../../../../../../lib/platform-queues/queue-registry"
import {
  platformQueueJobParamsSchema,
  validateParams,
} from "../../../../../../../lib/platform-http/validateBody"

export async function POST(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!req.platformOperator) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const params = validateParams(platformQueueJobParamsSchema, req.params)

  if (!resolvePlatformQueueDefinition(params.name)) {
    res.status(404).json({ message: `Unknown queue "${params.name}"` })
    return
  }

  const monitor = getPlatformQueueMonitor()

  try {
    const result = await monitor.retryJob(params.name, params.id)
    res.status(200).json(result)
  } catch (error) {
    if (error instanceof PlatformQueueMonitorError) {
      if (error.code === "NOT_FOUND") {
        res.status(404).json({ message: error.message })
        return
      }
      res.status(409).json({ message: error.message })
      return
    }
    throw error
  }
}
