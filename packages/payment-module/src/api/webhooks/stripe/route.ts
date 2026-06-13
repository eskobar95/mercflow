import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"

import type PaymentModuleService from "../../../modules/payment/service"
import { PAYMENT_MODULE } from "../../../modules/payment/types"
import type { WebhookEvent } from "../../../modules/payment/types"

type TenantScopedRequest = {
  mercflowStoreId?: string
}

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

function resolveWebhookStoreId(req: MedusaRequest): string {
  const tenantReq = req as TenantScopedRequest
  if (tenantReq.mercflowStoreId !== undefined && tenantReq.mercflowStoreId.trim() !== "") {
    return tenantReq.mercflowStoreId.trim()
  }

  const header = req.headers["x-store-id"]
  const headerValue = Array.isArray(header) ? header[0] : header
  if (typeof headerValue === "string" && headerValue.trim() !== "") {
    return headerValue.trim()
  }

  const fromEnv = process.env.MERCFLOW_DEFAULT_STORE_ID?.trim()
  if (fromEnv !== undefined && fromEnv !== "") {
    return fromEnv
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "Unable to resolve store for Stripe webhook"
  )
}

export type StripeWebhookHandlerResult = {
  action?: string
  customer_id?: string | null
}

export type StripeWebhookRouteDeps = {
  handleEvent: (
    req: MedusaRequest,
    event: WebhookEvent,
    storeId: string
  ) => Promise<StripeWebhookHandlerResult>
}

export function createStripeWebhookPost(
  deps: StripeWebhookRouteDeps
): (req: MedusaRequest, res: MedusaResponse) => Promise<void> {
  return async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
    const signature = readStripeSignature(req)
    if (signature === null) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing Stripe-Signature header"
      )
    }

    const storeId = resolveWebhookStoreId(req)
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
    const result = await deps.handleEvent(req, event, storeId)

    res.status(200).json({
      received: true,
      action: result.action ?? null,
      customer_id: result.customer_id ?? null,
    })
  }
}
