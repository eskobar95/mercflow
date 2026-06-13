/**
 * Client-side Stripe platform publishable key for signup billing step.
 */
export function getStripePlatformPublishableKey(): string | null {
  const key = import.meta.env.VITE_STRIPE_PLATFORM_PUBLISHABLE_KEY?.trim()
  return key && key.length > 0 ? key : null
}
