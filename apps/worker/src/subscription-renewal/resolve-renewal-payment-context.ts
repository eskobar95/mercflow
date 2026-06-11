import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"

import type { ChargeableSubscription, RenewalPaymentContext } from "./charge-subscription"

type PaymentAccountRow = {
  id: string
  provider_id: string
  data?: Record<string, unknown> | null
}

type AccountHolderRow = {
  id: string
  provider_id: string
  data?: Record<string, unknown> | null
}

export async function resolveRenewalPaymentContext(
  container: MedusaContainer,
  subscription: ChargeableSubscription
): Promise<RenewalPaymentContext> {
  const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY) as {
    graph: (input: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data: unknown[] }>
  }

  const accountHolderResult = await remoteQuery.graph({
    entity: "account_holder",
    fields: ["id", "provider_id", "data"],
    filters: {
      customer_id: subscription.customer_id,
      provider_id: "pp_stripe_stripe",
    },
  })

  const accountHolder = accountHolderResult.data[0] as AccountHolderRow | undefined
  const stripeCustomerId =
    typeof accountHolder?.data?.id === "string" ? accountHolder.data.id : null

  if (stripeCustomerId === null) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Stripe customer not found for customer "${subscription.customer_id}"`
    )
  }

  const paymentAccountResult = await remoteQuery.graph({
    entity: "payment_account",
    fields: ["id", "provider_id", "data"],
    filters: {
      customer_id: subscription.customer_id,
      provider_id: "pp_stripe_stripe",
    },
  })

  const paymentAccount = paymentAccountResult.data[0] as PaymentAccountRow | undefined
  const paymentMethodId =
    typeof paymentAccount?.data?.default_payment_method_id === "string"
      ? paymentAccount.data.default_payment_method_id
      : typeof paymentAccount?.data?.payment_method_id === "string"
        ? paymentAccount.data.payment_method_id
        : null

  if (paymentMethodId === null) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Default Stripe payment method not found for customer "${subscription.customer_id}"`
    )
  }

  return {
    stripeCustomerId,
    paymentMethodId,
  }
}
