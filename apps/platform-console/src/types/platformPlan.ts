export type PlatformPlan = {
  tier: string
  name: string
  interval: string
  currency: string
  amount: number
  price_id: string
}

export type PlatformPlansResponse = {
  plans: PlatformPlan[]
}

export const PLATFORM_TIERS = ["standard", "pro"] as const

export type PlatformTier = (typeof PLATFORM_TIERS)[number]

export type BillingInterval = "month" | "year"
