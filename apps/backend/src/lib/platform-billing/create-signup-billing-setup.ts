import type Stripe from "stripe"

import { hashInviteToken } from "../platform-invites/token"
import {
  getStripePlatformClient,
  getStripePlatformPriceId,
} from "./stripe-platform-client"

export type SignupBillingSetupResult = {
  client_secret: string
  customer_id: string
  subscription_id: string
  payment_intent_id: string
}

function resolvePaymentIntent(
  invoice: Stripe.Invoice | string | null,
): Stripe.PaymentIntent | null {
  if (invoice === null || typeof invoice === "string") {
    return null
  }

  const paymentIntent = invoice.payment_intent
  if (paymentIntent === null || typeof paymentIntent === "string") {
    return null
  }

  return paymentIntent
}

export async function createSignupBillingSetup(input: {
  email: string
  inviteToken: string
  storeName: string
}): Promise<SignupBillingSetupResult> {
  const priceId = getStripePlatformPriceId()
  if (!priceId) {
    throw new Error("STRIPE_PLATFORM_PRICE_ID is not configured")
  }

  const stripe = getStripePlatformClient()
  const inviteTokenHash = hashInviteToken(input.inviteToken)

  const customer = await stripe.customers.create({
    email: input.email,
    name: input.storeName,
    metadata: {
      invite_token_hash: inviteTokenHash,
      signup_flow: "mercflow_platform",
    },
  })

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
    metadata: {
      invite_token_hash: inviteTokenHash,
      signup_flow: "mercflow_platform",
    },
  })

  const latestInvoice = subscription.latest_invoice
  const paymentIntent = resolvePaymentIntent(
    typeof latestInvoice === "string" || latestInvoice === null
      ? latestInvoice
      : latestInvoice,
  )

  if (paymentIntent?.client_secret === null || paymentIntent?.client_secret === undefined) {
    throw new Error("Stripe did not return a payment intent client secret")
  }

  return {
    client_secret: paymentIntent.client_secret,
    customer_id: customer.id,
    subscription_id: subscription.id,
    payment_intent_id: paymentIntent.id,
  }
}
