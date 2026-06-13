import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"
import { PAYMENT_MODULE } from "@mercflow/payment-module"
import type { PaymentModuleService } from "@mercflow/payment-module"

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

  const storeId = resolveMercflowStoreId(req)
  const paymentService = req.scope.resolve(PAYMENT_MODULE) as unknown as PaymentModuleService

  let webhookSecret: string
  try {
    webhookSecret = await paymentService.getWebhookSecret(storeId)
  } catch (error: unknown) {
    if (error instanceof MedusaError) {
      throw error
    }
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

  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody)
  if (!paymentService.verifyWebhookSignature(payload, signature, webhookSecret)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid webhook signature")
  }

  const provider = await paymentService.getActiveProvider(storeId)
  const event = await provider.handleWebhook(payload, signature, webhookSecret)

  const service = req.scope.resolve(SUBSCRIPTION_MODULE) as SubscriptionModuleService
  const config = await service.getOrCreateSubscriptionConfig(storeId)
  const result = await handleClubMembershipStripeEvent(req.scope, event, config)

  res.status(200).json({
    received: true,
    action: result.action,
    customer_id: result.customer_id ?? null,
  })
}
