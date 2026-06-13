const STANDARD_FEATURES = [
  "Full MercFlow admin",
  "Product and category management",
  "Orders and customer records",
  "Email notifications",
] as const

const PRO_FEATURES = [
  "Everything in Standard",
  "Advanced inventory workflows",
  "Purchase orders and receipts",
  "Priority support",
] as const

export function getPlanTierFeatures(tier: string): readonly string[] {
  if (tier === "pro") {
    return PRO_FEATURES
  }

  return STANDARD_FEATURES
}
