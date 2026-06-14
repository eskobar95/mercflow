import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { verifySignupPaymentIntent } from "../../../lib/platform-billing/verify-signup-payment"
import { isStripePlatformConfigured } from "../../../lib/platform-billing/stripe-platform-client"
import { validatePlatformInviteToken } from "../../../lib/platform-db/platform-invites"
import { requirePlatformDatabase } from "../../../lib/platform-http/require-platform-operator"
import { validateBody } from "../../../lib/platform-http/validateBody"
import { enqueueProvisionTenantJob } from "../../../lib/platform-provisioning/enqueue-provision-tenant"
import { signupProvisionBodySchema } from "../../../lib/platform-provisioning/validators"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> {
  if (!requirePlatformDatabase(res)) {
    return
  }

  if (!isStripePlatformConfigured()) {
    res.status(503).json({
      message:
        "Stripe platform billing is not configured. Set STRIPE_PLATFORM_SECRET_KEY.",
    })
    return
  }

  const body = validateBody(signupProvisionBodySchema, req)

  const invite = await validatePlatformInviteToken(body.invite_token)
  if (!invite.valid) {
    res.status(403).json({ message: "Invalid or expired invite token" })
    return
  }

  if (invite.email && invite.email.toLowerCase() !== body.email.toLowerCase()) {
    res.status(400).json({ message: "Email must match the invited address" })
    return
  }

  try {
    const verified = await verifySignupPaymentIntent(body.stripe_payment_intent_id)

    if (
      body.stripe_customer_id &&
      body.stripe_customer_id !== verified.customer_id
    ) {
      res.status(400).json({ message: "Stripe customer does not match payment intent" })
      return
    }

    const result = await enqueueProvisionTenantJob(body, {
      stripe_customer_id: verified.customer_id,
      stripe_payment_intent_id: verified.payment_intent_id,
      stripe_subscription_id:
        body.stripe_subscription_id ?? verified.subscription_id,
    })

    res.status(202).json(result)
  } catch (error) {
    res.status(400).json({
      message:
        error instanceof Error ? error.message : "Failed to start provisioning",
    })
  }
}
