import type Stripe from "stripe"

import {
  getStripePlatformClient,
  getStripePlatformWebhookSecret,
} from "./stripe-platform-client"

export function constructStripePlatformWebhookEvent(
  rawBody: string | Buffer,
  signature: string,
): Stripe.Event {
  const webhookSecret = getStripePlatformWebhookSecret()
  if (!webhookSecret) {
    throw new Error("STRIPE_PLATFORM_WEBHOOK_SECRET is not configured")
  }

  const stripe = getStripePlatformClient()
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
}
