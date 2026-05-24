import Stripe from "stripe"

/**
 * Validates that a Stripe restricted/secret API key boots and can authenticate.
 */
export async function stripeTestConnection(secretKey: string): Promise<void> {
  const stripe = new Stripe(secretKey)
  await stripe.balance.retrieve()
}
