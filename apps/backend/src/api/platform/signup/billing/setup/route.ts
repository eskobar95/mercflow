import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { isStripePlatformConfigured } from "../../../../../lib/platform-billing/stripe-platform-client"
import { createSignupBillingCheckout } from "../../../../../lib/platform-billing/create-signup-billing-checkout"
import { requirePlatformDatabase } from "../../../../../lib/platform-http/require-platform-operator"
import { validateBody } from "../../../../../lib/platform-http/validateBody"
import { signupBillingSetupBodySchema } from "../../../../../lib/platform-provisioning/validators"
import { validateSignupInviteForRequest } from "../../../../../lib/platform-signup/validate-signup-invite"

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

  const body = validateBody(signupBillingSetupBodySchema, req)

  const inviteValidation = await validateSignupInviteForRequest({
    inviteToken: body.invite_token,
    email: body.email,
  })
  if (!inviteValidation.ok) {
    res.status(inviteValidation.status).json({ message: inviteValidation.message })
    return
  }

  try {
    const billing = await createSignupBillingCheckout({
      priceId: body.price_id,
      email: body.email,
      inviteToken: body.invite_token,
      storeName: body.store_name,
      clerkUserId: body.clerk_user_id,
      domain: body.domain,
      currency: body.currency,
      country: body.country,
      timezone: body.timezone,
      successUrl: body.success_url,
      cancelUrl: body.cancel_url,
    })

    res.status(200).json(billing)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create billing setup"

    if (
      message === "Price is not active" ||
      message === "Price is not a valid MercFlow platform plan"
    ) {
      res.status(400).json({ message })
      return
    }

    res.status(500).json({ message })
  }
}
