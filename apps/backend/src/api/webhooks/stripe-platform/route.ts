import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  constructStripePlatformWebhookEvent,
  handleStripePlatformWebhookEvent,
} from "../../../lib/platform-billing/stripe-platform-webhook"

function readStripeSignature(req: MedusaRequest): string | null {
  const header = req.headers["stripe-signature"]
  if (typeof header === "string" && header.length > 0) {
    return header
  }
  if (Array.isArray(header) && header[0]) {
    return header[0]
  }
  return null
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  const signature = readStripeSignature(req)
  if (!signature) {
    res.status(400).json({ message: "Missing Stripe-Signature header" })
    return
  }

  const rawBody = req.rawBody
  if (rawBody === undefined) {
    res.status(400).json({ message: "Missing raw request body" })
    return
  }

  try {
    const event = constructStripePlatformWebhookEvent(rawBody, signature)
    const result = await handleStripePlatformWebhookEvent(event)
    res.status(200).json({ received: true, ...result })
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Stripe platform webhook verification failed",
    })
  }
}
