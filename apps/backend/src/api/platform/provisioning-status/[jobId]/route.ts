import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getProvisioningJobState } from "../../../../lib/platform-provisioning/job-state"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const jobId = req.params.jobId
  if (typeof jobId !== "string" || jobId.trim() === "") {
    res.status(400).json({ message: "Missing job id" })
    return
  }

  try {
    const state = await getProvisioningJobState(jobId)
    if (!state) {
      res.status(404).json({ message: `Provisioning job not found: ${jobId}` })
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
