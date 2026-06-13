import Stripe from "stripe"

import type {
  CapturePaymentParams,
  ChargeResult,
  ChargeSubscriptionParams,
  CheckoutSession,
  CreateCheckoutSessionParams,
  CreateSubscriptionParams,
  IPaymentProvider,
  PaymentProviderKey,
  PaymentResult,
  ProviderSubscription,
  RefundPaymentParams,
  RefundResult,
  ResolvedProviderCredentials,
  WebhookEvent,
} from "../types"
import { throwPaymentNotImplemented } from "./payment-not-implemented"

export type StripePaymentProviderOptions = {
  credentials: ResolvedProviderCredentials
  stripeClient?: Stripe
}

const STRIPE_WEBHOOK_CLIENT_KEY = "mercflow_webhook_verification_only"

export function verifyStripeWebhookSignature(
  payload: Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const stripe = new Stripe(STRIPE_WEBHOOK_CLIENT_KEY)
    stripe.webhooks.constructEvent(payload, signature, secret)
    return true
  } catch {
    return false
  }
}

export class StripePaymentProvider implements IPaymentProvider {
  readonly providerKey: PaymentProviderKey = "stripe"

  private readonly stripe: Stripe

  constructor(options: StripePaymentProviderOptions) {
    this.stripe =
      options.stripeClient ??
      new Stripe(options.credentials.secretKey)
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
    void params
    throwPaymentNotImplemented("createCheckoutSession")
  }

  async capturePayment(params: CapturePaymentParams): Promise<PaymentResult> {
    void params
    throwPaymentNotImplemented("capturePayment")
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundResult> {
    void params
    throwPaymentNotImplemented("refundPayment")
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<ProviderSubscription> {
    void params
    throwPaymentNotImplemented("createSubscription")
  }

  async chargeSubscription(params: ChargeSubscriptionParams): Promise<ChargeResult> {
    const intent = await this.stripe.paymentIntents.create(
      {
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        confirm: true,
        off_session: true,
        payment_method_types: ["card"],
        metadata: params.metadata,
      },
      {
        idempotencyKey: params.idempotencyKey,
      }
    )

    return {
      paymentIntentId: intent.id,
      status: intent.status,
    }
  }

  async pauseSubscription(subscriptionId: string): Promise<void> {
    void subscriptionId
    throwPaymentNotImplemented("pauseSubscription")
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    void subscriptionId
    throwPaymentNotImplemented("cancelSubscription")
  }

  async handleWebhook(
    payload: Buffer,
    signature: string,
    secret: string
  ): Promise<WebhookEvent> {
    const event = this.stripe.webhooks.constructEvent(payload, signature, secret)
    return {
      id: event.id,
      type: event.type,
      data: event.data,
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
    return verifyStripeWebhookSignature(payload, signature, secret)
  }
}
