import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { createSignupBillingSetup } from "../../../../../lib/platform-billing/create-signup-billing-setup"
import { isStripePlatformConfigured } from "../../../../../lib/platform-billing/stripe-platform-client"
import { validatePlatformInviteToken } from "../../../../../lib/platform-db/platform-invites"
import { requirePlatformDatabase } from "../../../../../lib/platform-http/require-platform-operator"
import { signupBillingSetupBodySchema } from "../../../../../lib/platform-provisioning/validators"
import { sendPlatformZodError } from "../../../../../lib/platform-http/list-query"

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
        "Stripe platform billing is not configured. Set STRIPE_PLATFORM_SECRET_KEY and STRIPE_PLATFORM_PRICE_ID.",
    })
    return
  }

  const parsed = signupBillingSetupBodySchema.safeParse(req.body)
  if (!parsed.success) {
    sendPlatformZodError(res, parsed.error)
    return
  }

  const invite = await validatePlatformInviteToken(parsed.data.invite_token)
  if (!invite.valid) {
    res.status(403).json({ message: "Invalid or expired invite token" })
    return
  }

  if (invite.email && invite.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
    res.status(400).json({ message: "Email must match the invited address" })
    return
  }

  try {
    const billing = await createSignupBillingSetup({
      email: parsed.data.email,
      inviteToken: parsed.data.invite_token,
      storeName: parsed.data.store_name,
    })

    res.status(200).json(billing)
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to create billing setup",
    })
  }
}
