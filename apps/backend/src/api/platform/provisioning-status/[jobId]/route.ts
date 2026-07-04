import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getProvisioningJobState } from "../../../../lib/platform-provisioning/job-state"
import { reconcileProvisioningJobState } from "../../../../lib/platform-provisioning/reconcile-provisioning-job-state"
import {
  platformJobIdParamsSchema,
  validateParams,
} from "../../../../lib/platform-http/validateBody"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const params = validateParams(platformJobIdParamsSchema, req.params)

  try {
    await reconcileProvisioningJobState(params.jobId)
    const state = await getProvisioningJobState(params.jobId)
    if (!state) {
      res.status(404).json({ message: `Provisioning job not found: ${params.jobId}` })
      return
    }

    res.status(200).json(state)
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to load provisioning status",
    })
  }
}
