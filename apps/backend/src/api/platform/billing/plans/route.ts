import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { fetchPlatformPlans } from "../../../../lib/platform-billing/fetch-platform-plans"
import { isStripePlatformConfigured } from "../../../../lib/platform-billing/stripe-platform-client"
import { platformBillingPlansQuerySchema } from "../../../../lib/platform-provisioning/validators"
import { sendPlatformZodError } from "../../../../lib/platform-http/list-query"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!isStripePlatformConfigured()) {
    res.status(503).json({
      message:
        "Stripe platform billing is not configured. Set STRIPE_PLATFORM_SECRET_KEY.",
    })
    return
  }

  const parsed = platformBillingPlansQuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    sendPlatformZodError(res, parsed.error)
    return
  }

  try {
    const result = await fetchPlatformPlans(parsed.data.currency)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to fetch platform plans",
    })
  }
}
