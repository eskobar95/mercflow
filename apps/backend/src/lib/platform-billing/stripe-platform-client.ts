import Stripe from "stripe"

let stripeClient: Stripe | null = null

export function getStripePlatformSecretKey(): string | null {
  const key = process.env.STRIPE_PLATFORM_SECRET_KEY?.trim()
  return key && key.length > 0 ? key : null
}

export function getStripePlatformPriceId(): string | null {
  const priceId = process.env.STRIPE_PLATFORM_PRICE_ID?.trim()
  return priceId && priceId.length > 0 ? priceId : null
}

export function getStripePlatformWebhookSecret(): string | null {
  const secret = process.env.STRIPE_PLATFORM_WEBHOOK_SECRET?.trim()
  return secret && secret.length > 0 ? secret : null
}

export function isStripePlatformConfigured(): boolean {
  return getStripePlatformSecretKey() !== null && getStripePlatformPriceId() !== null
}

export function getStripePlatformClient(): Stripe {
  const secretKey = getStripePlatformSecretKey()
  if (!secretKey) {
    throw new Error("STRIPE_PLATFORM_SECRET_KEY is not configured")
  }

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: "2024-04-10",
  })

  return stripeClient
}
