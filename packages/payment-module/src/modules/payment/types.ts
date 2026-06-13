export const PAYMENT_MODULE = "payment" as const

export const PAYMENT_PROVIDERS = ["stripe", "mobilepay", "klarna"] as const
export type PaymentProviderKey = (typeof PAYMENT_PROVIDERS)[number]

export const PAYMENT_MODES = ["test", "live"] as const
export type PaymentMode = (typeof PAYMENT_MODES)[number]

export type CreateCheckoutSessionParams = {
  amount: number
  currency: string
  customerId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export type CheckoutSession = {
  id: string
  url: string | null
}

export type CapturePaymentParams = {
  paymentIntentId: string
  amount?: number
}

export type PaymentResult = {
  id: string
  status: string
}

export type RefundPaymentParams = {
  paymentIntentId: string
  amount?: number
  reason?: string
}

export type RefundResult = {
  id: string
  status: string
}

export type CreateSubscriptionParams = {
  customerId: string
  priceId: string
  metadata?: Record<string, string>
}

export type ProviderSubscription = {
  id: string
  status: string
}

export type ChargeSubscriptionParams = {
  customerId: string
  amount: number
  currency: string
  idempotencyKey: string
  paymentMethodId?: string
  metadata?: Record<string, string>
}

export type ChargeResult = {
  paymentIntentId: string
  status: string
}

export type WebhookEvent = {
  id: string
  type: string
  data: unknown
}

export type ResolvedProviderCredentials = {
  secretKey: string
  publishableKey: string | null
  webhookSecret: string | null
  mode: PaymentMode
}

export type PaymentProviderConfigRecord = {
  id: string
  store_id: string
  provider: PaymentProviderKey
  test_publishable_key: string | null
  live_publishable_key: string | null
  mode: PaymentMode
  created_at: string | Date
  updated_at: string | Date
  deleted_at: string | Date | null
}

export type UpsertProviderConfigInput = {
  provider: PaymentProviderKey
  test_secret_key?: string | null
  test_publishable_key?: string | null
  test_webhook_secret?: string | null
  live_secret_key?: string | null
  live_publishable_key?: string | null
  live_webhook_secret?: string | null
  mode?: PaymentMode
}

export type PublicProviderConfig = PaymentProviderConfigRecord & {
  publishable_key: string | null
}

export interface IPaymentProvider {
  readonly providerKey: PaymentProviderKey

  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession>
  capturePayment(params: CapturePaymentParams): Promise<PaymentResult>
  refundPayment(params: RefundPaymentParams): Promise<RefundResult>

  createSubscription(params: CreateSubscriptionParams): Promise<ProviderSubscription>
  chargeSubscription(params: ChargeSubscriptionParams): Promise<ChargeResult>
  pauseSubscription(subscriptionId: string): Promise<void>
  cancelSubscription(subscriptionId: string): Promise<void>

  handleWebhook(payload: Buffer, signature: string, secret: string): Promise<WebhookEvent>
  verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean
}
