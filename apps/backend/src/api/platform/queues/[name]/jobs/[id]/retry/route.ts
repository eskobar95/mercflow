import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../../../../lib/platform-auth/clerk-platform-auth-middleware"
import {
  getPlatformQueueMonitor,
  PlatformQueueMonitorError,
} from "../../../../../../../lib/platform-queues/platform-queue-monitor"
import { resolvePlatformQueueDefinition } from "../../../../../../../lib/platform-queues/queue-registry"

export async function POST(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!req.platformOperator) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const queueName = req.params.name
  const jobId = req.params.id

  if (!queueName || !resolvePlatformQueueDefinition(queueName)) {
    res.status(404).json({ message: `Unknown queue "${queueName ?? ""}"` })
    return
  }

  if (!jobId) {
    res.status(400).json({ message: "Missing job id" })
    return
  }

  const monitor = getPlatformQueueMonitor()

  try {
    const result = await monitor.retryJob(queueName, jobId)
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
