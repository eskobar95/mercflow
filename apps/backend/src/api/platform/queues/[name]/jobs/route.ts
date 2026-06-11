import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../../lib/platform-auth/clerk-platform-auth-middleware"
import { getPlatformQueueMonitor } from "../../../../../lib/platform-queues/platform-queue-monitor"
import { resolvePlatformQueueDefinition } from "../../../../../lib/platform-queues/queue-registry"

function parseFailedStatusQuery(query: Record<string, unknown> | undefined): "failed" | null {
  const rawStatus = query?.status
  if (rawStatus === undefined) {
    return "failed"
  }
  if (typeof rawStatus === "string" && rawStatus === "failed") {
    return "failed"
  }
  return null
}

export async function GET(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!req.platformOperator) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const queueName = req.params.name
  if (!queueName || !resolvePlatformQueueDefinition(queueName)) {
    res.status(404).json({ message: `Unknown queue "${queueName ?? ""}"` })
    return
  }

  const status = parseFailedStatusQuery(req.query as Record<string, unknown> | undefined)
  if (!status) {
    res.status(400).json({
      message: "Invalid query parameters",
      type: "invalid_data",
      code: "INVALID_QUERY",
    })
    return
  }

  const monitor = getPlatformQueueMonitor()
  const jobs = await monitor.listFailedJobs(queueName)

  res.status(200).json({
    queue: queueName,
    status,
    jobs,
  })
}
