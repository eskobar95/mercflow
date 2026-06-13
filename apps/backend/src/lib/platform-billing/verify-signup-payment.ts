import { getStripePlatformClient } from "./stripe-platform-client"

export type VerifiedSignupPayment = {
  customer_id: string
  payment_intent_id: string
  subscription_id: string | null
}

export async function verifySignupPaymentIntent(
  paymentIntentId: string,
): Promise<VerifiedSignupPayment> {
  const stripe = getStripePlatformClient()
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["invoice.subscription"],
  })

  if (paymentIntent.status !== "succeeded") {
    throw new Error(`Payment is not complete (status: ${paymentIntent.status})`)
  }

  const customerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id

  if (!customerId) {
    throw new Error("Payment intent is missing a Stripe customer")
  }

  let subscriptionId: string | null = null
  const invoice = paymentIntent.invoice
  if (invoice !== null && typeof invoice !== "string") {
    const subscription = invoice.subscription
    if (typeof subscription === "string") {
      subscriptionId = subscription
    } else if (subscription !== null) {
      subscriptionId = subscription.id
    }
  }

  return {
    customer_id: customerId,
    payment_intent_id: paymentIntent.id,
    subscription_id: subscriptionId,
  }
}
