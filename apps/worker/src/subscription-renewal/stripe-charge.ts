export type StripePaymentIntentCreateParams = {
  amount: number
  currency: string
  customer: string
  payment_method: string
  off_session: boolean
  confirm: boolean
  metadata: Record<string, string>
}

export type StripePaymentIntentClient = {
  paymentIntents: {
    create: (
      params: StripePaymentIntentCreateParams,
      options?: { idempotencyKey?: string }
    ) => Promise<{ id: string; status: string }>
  }
}

export type CreateRenewalPaymentIntentInput = {
  amount: number
  currency: string
  customerId: string
  paymentMethodId: string
  idempotencyKey: string
  metadata: Record<string, string>
}

export async function createRenewalPaymentIntent(
  stripe: StripePaymentIntentClient,
  input: CreateRenewalPaymentIntentInput
): Promise<{ id: string; status: string }> {
  return stripe.paymentIntents.create(
    {
      amount: input.amount,
      currency: input.currency,
      customer: input.customerId,
      payment_method: input.paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: input.metadata,
    },
    { idempotencyKey: input.idempotencyKey }
  )
}
