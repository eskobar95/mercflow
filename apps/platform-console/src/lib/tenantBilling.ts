import type { PlatformTenantBilling } from "@/lib/platformTenantsApi"

export type BillingSubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "unknown"

export function normalizeBillingSubscriptionStatus(
  status: string,
): BillingSubscriptionStatus {
  if (status === "active") {
    return "active"
  }
  if (status === "past_due") {
    return "past_due"
  }
  if (status === "canceled" || status === "cancelled") {
    return "canceled"
  }
  return "unknown"
}

export function formatPlanTierLabel(planTier: string): string {
  if (planTier === "standard") {
    return "Standard"
  }
  if (planTier === "pro") {
    return "Pro"
  }
  return planTier
}

export function formatBillingInterval(interval: string): string {
  if (interval === "month") {
    return "Monthly"
  }
  if (interval === "year") {
    return "Annual"
  }
  return interval
}

export function formatBillingCurrency(currency: string): string {
  return currency.toUpperCase()
}

export function formatBillingRenewalDate(
  currentPeriodEnd: string | null,
): string | null {
  if (currentPeriodEnd === null) {
    return null
  }

  const date = new Date(currentPeriodEnd)
  if (Number.isNaN(date.getTime())) {
    return currentPeriodEnd
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function buildStripeCustomerDashboardUrl(
  stripeCustomerId: string,
): string {
  return `https://dashboard.stripe.com/customers/${encodeURIComponent(stripeCustomerId)}`
}

export function canSuspendTenantBilling(
  billing: PlatformTenantBilling | null,
  isTenantDisabled: boolean,
): boolean {
  if (isTenantDisabled) {
    return false
  }
  if (billing === null) {
    return false
  }
  return normalizeBillingSubscriptionStatus(billing.subscription_status) !== "canceled"
}
