import type { BillingInterval } from "@/types/platformPlan"

function resolveIntervalSuffix(currency: string, interval: BillingInterval): string {
  const normalizedCurrency = currency.trim().toLowerCase()

  if (normalizedCurrency === "dkk") {
    return interval === "year" ? "år" : "md"
  }

  return interval === "year" ? "yr" : "mo"
}

function formatAmount(amountMinor: number, currency: string): string {
  const amount = amountMinor / 100
  const normalizedCurrency = currency.trim().toLowerCase()

  if (normalizedCurrency === "dkk" || normalizedCurrency === "sek" || normalizedCurrency === "nok") {
    return String(Math.round(amount))
  }

  if (normalizedCurrency === "eur") {
    const rounded = Math.round(amount)
    return amount % 1 === 0 ? `€${rounded}` : `€${amount.toFixed(2)}`
  }

  if (normalizedCurrency === "usd" || normalizedCurrency === "gbp") {
    const symbol = normalizedCurrency === "usd" ? "$" : "£"
    const rounded = Math.round(amount)
    return amount % 1 === 0 ? `${symbol}${rounded}` : `${symbol}${amount.toFixed(2)}`
  }

  return amount.toFixed(2)
}

export function formatPlanPrice(
  amountMinor: number,
  currency: string,
  interval: string,
): string {
  const billingInterval: BillingInterval = interval === "year" ? "year" : "month"
  const suffix = resolveIntervalSuffix(currency, billingInterval)
  const amountLabel = formatAmount(amountMinor, currency)

  if (currency.trim().toLowerCase() === "dkk") {
    return `${amountLabel} kr/${suffix}`
  }

  return `${amountLabel}/${suffix}`
}

export function formatTierLabel(tier: string): string {
  if (tier === "pro") {
    return "Pro"
  }

  if (tier === "standard") {
    return "Standard"
  }

  return tier.charAt(0).toUpperCase() + tier.slice(1)
}
