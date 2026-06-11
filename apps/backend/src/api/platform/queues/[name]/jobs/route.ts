import type { MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

import type { PlatformAuthRequest } from "../../../../../lib/platform-auth/clerk-platform-auth-middleware"
import { getPlatformQueueMonitor } from "../../../../../lib/platform-queues/platform-queue-monitor"
import { resolvePlatformQueueDefinition } from "../../../../../lib/platform-queues/queue-registry"

const jobsQuerySchema = z.object({
  status: z.literal("failed").default("failed"),
})

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

  const parsedQuery = jobsQuerySchema.safeParse(req.query ?? {})
  if (!parsedQuery.success) {
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
    status: parsedQuery.data.status,
    jobs,
  })
}
