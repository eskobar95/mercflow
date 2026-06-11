import type { MedusaResponse } from "@medusajs/framework/http"

import type { PlatformAuthRequest } from "../../../../lib/platform-auth/clerk-platform-auth-middleware"
import { fetchPlatformSystemMetrics } from "../../../../lib/platform-metrics/fetch-system-metrics"
import { requirePlatformOperator } from "../../../../lib/platform-http/require-platform-operator"

export async function GET(
  req: PlatformAuthRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!requirePlatformOperator(req, res)) {
    return
  }

  try {
    const metrics = await fetchPlatformSystemMetrics()
    res.status(200).json(metrics)
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to fetch system metrics",
    })
  }
}
