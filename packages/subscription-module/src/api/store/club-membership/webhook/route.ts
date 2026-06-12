import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"
import StripeSdk from "stripe"

import { CONNECTOR_MODULE } from "@mercflow/connector-module"

type StripeConnectorResolver = {
  resolveStripeSecretKeyOrNull: () => Promise<string | null>
  resolveStripeWebhookSecretOrNull: () => Promise<string | null>
}

import { handleClubMembershipStripeEvent } from "../../../../modules/subscription/club-membership"
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription"
import { resolveMercflowStoreId } from "../../../../modules/subscription/resolve-store-id"
import type SubscriptionModuleService from "../../../../modules/subscription/service"

function readStripeSignature(req: MedusaRequest): string | null {
  const header = req.headers["stripe-signature"]
  if (typeof header === "string" && header.trim() !== "") {
    return header.trim()
  }
  if (Array.isArray(header) && typeof header[0] === "string" && header[0].trim() !== "") {
    return header[0].trim()
  }
  return null
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const signature = readStripeSignature(req)
  if (signature === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing Stripe-Signature header"
    )
  }

  const connectorService = req.scope.resolve(CONNECTOR_MODULE) as StripeConnectorResolver
  const webhookSecret = await connectorService.resolveStripeWebhookSecretOrNull()
  if (webhookSecret === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stripe webhook secret is not configured"
    )
  }

  const rawBody = req.rawBody
  if (rawBody === undefined || rawBody === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Webhook raw body is required for signature verification"
    )
  }

  const stripeSecretKey = await connectorService.resolveStripeSecretKeyOrNull()
  if (stripeSecretKey === null) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stripe secret key is not configured"
    )
  }

  const stripe = new StripeSdk(stripeSecretKey)
  let event: StripeSdk.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook signature"
    throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
  }

  const storeId = resolveMercflowStoreId(req)

  const service = req.scope.resolve(SUBSCRIPTION_MODULE) as SubscriptionModuleService
  const config = await service.getOrCreateSubscriptionConfig(storeId)
  const result = await handleClubMembershipStripeEvent(req.scope, event, config)

  res.status(200).json({
    received: true,
    action: result.action,
    customer_id: result.customer_id ?? null,
  })
}
